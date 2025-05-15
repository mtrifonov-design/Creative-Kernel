import CreativeKernel from "../kernel/KernelOBSOLETE";
import { CK_InstallUnit, CK_Modality, CK_TerminateUnit, CK_Unit, CK_WorkerUnit } from "../kernel/types";
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
    async installUnit(unit: CK_InstallUnit): Promise<false | { [key:string] : any }> {
        const { instance } = unit;
        const { instance_id, resource_id } = instance;
        //console.log("installing", instance_id, resource_id);
        const module = await getQuickJS();
        const vm = await module.newContext();
        this.instances[instance_id] = { module, vm, resourceId: resource_id };
        //console.log(this.instances)
        const manifest = await fetch(resource_id+"/manifest.json").then((res) => res.json());
        const jsCode = await fetch(resource_id+"/index.js").then((res) => res.text());
        const logHandle = vm.newFunction("log", (...args) => {
            const nativeArgs = args.map(vm.dump);
            console.log(...nativeArgs);
        });
        vm.setProp(vm.global,"log", logHandle);
        const errorHandle = vm.newFunction("log", (...args) => {
            const nativeArgs = args.map(vm.dump)
            console.error("QuickJS:", ...nativeArgs)
          })
        // Partially implement `console` object
        const consoleHandle = vm.newObject()
        vm.setProp(consoleHandle, "log", logHandle)
        vm.setProp(consoleHandle, "error", errorHandle)
        vm.setProp(vm.global, "console", consoleHandle)
        consoleHandle.dispose()
        logHandle.dispose()
        errorHandle.dispose()

        // create handle for a randomId() function
        const randomUUID = () => {return crypto.randomUUID()};
        const randomUUIDHandle = vm.newFunction("randomUUID", (...args) => {
            const nativeArgs = args.map(vm.dump);
            const result = randomUUID();
            return vm.newString(result);
        });
        vm.setProp(vm.global, "randomUUID", randomUUIDHandle);
        randomUUIDHandle.dispose();

        const res = vm.evalCode(jsCode);
        const success = vm.unwrapResult(res);
        return manifest;
    }


    async terminateUnit(unit: CK_TerminateUnit): Promise<boolean> {
        const { instance } = unit;
        const { instance_id } = instance;
        delete this.instances[instance_id];
        return true;
    }



    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {

        const { receiver } = unit;
        const { instance_id } = receiver;
        //console.log(this.instances)
        
        const instance = this.instances[instance_id];
        if (!instance) {
            throw new Error(`Instance ${instance_id} not found`);
        }
        const { module, vm, resourceId } = instance;

        try {
        const res = vm.evalCode(`onCompute("${encodeURI(JSON.stringify(unit))}")`);

        if (res.error) {
            console.error(vm.dump(res.error));
            return {};
        }
        
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
        } catch (e) {
            console.error(e);
            return {};
        }
    
    
    }

}

export default WasmJSModality;