import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Modality, CK_Unit, CK_WorkerUnit } from "../kernel/types";
import {
    QuickJSContext,
    QuickJSWASMModule,
  } from "quickjs-emscripten"


import { getQuickJS } from "https://esm.sh/quickjs-emscripten@0.25.0"


class WasmJSModality implements CK_Modality {


    kernel: CreativeKernel | null = null;
    connectToKernel(kernel: CreativeKernel) {
        this.kernel = kernel;
    }

    instances: {
        [wasmId: string]: {
            module: QuickJSWASMModule,
            vm: QuickJSContext,
            resourceId: string,
        }
    } = {}; 
    async installUnit(unit: CK_InstallUnit): Promise<boolean> {
        const { instance } = unit;
        const { instance_id, resource_id } = instance;
        
        const module = await getQuickJS();
        const vm = module.newContext();
        this.instances[instance_id] = { module, vm, resourceId: resource_id };
        const jsCode = await fetch(resource_id).then((res) => res.text());
        const logHandle = vm.newFunction("log", (...args) => {
            const nativeArgs = args.map(vm.dump);
            console.log(...nativeArgs);
        });
        vm.setProp(vm.global,"log", logHandle);
        logHandle.dispose();
            
        const res = vm.evalCode(jsCode);
        const success = vm.unwrapResult(res);
        return success as boolean;
    }
    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {

        const { receiver } = unit;
        const { instance_id } = receiver;
        
        const instance = this.instances[instance_id];
        if (!instance) {
            throw new Error(`Instance ${instance_id} not found`);
        }
        const { module, vm, resourceId } = instance;

        const res = vm.evalCode(`onCompute("${encodeURI(JSON.stringify(unit))}")`);
        const response = vm.dump(res.value);
        const responseKeys = Object.keys(response);
        responseKeys.forEach((key) => {
            const threadQueue = response[key];
            threadQueue.forEach((unit: CK_Unit) => {
                if (unit.type === "worker") {
                    unit.sender = {
                        modality: "wasmjs",
                        resource_id: resourceId,
                        instance_id: instance_id,
                    }
                }
            });
        });
        return response as { [threadId: string]: CK_Unit[] };
    }

}

export default WasmJSModality;