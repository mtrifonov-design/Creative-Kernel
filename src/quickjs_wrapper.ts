import {
    QuickJSContext,
    QuickJSWASMModule,
  } from "quickjs-emscripten"


import { getQuickJS } from "https://esm.sh/quickjs-emscripten@0.25.0"

const instances : {
    [wasmId: string]: {
        module: QuickJSWASMModule,
        vm: QuickJSContext
    }
} = {};

async function install(wasmId: string, wasmUrl: string) {
    console.log()
    // const module = await newQuickJSWASMModule(RELEASE_SYNC);
    const module = await getQuickJS();
    const vm = module.newContext();
    instances[wasmId] = { module, vm };

    // fetch the js code associated with wasmUrl
    const response = await fetch(wasmUrl);
    const jsCode = await response.text();
    // run the js code

    const sendMessageHandle = vm.newFunction("sendMessage", (...args) => {
        const nativeArgs = args.map(vm.dump);
        const target = nativeArgs[0];
        const content = nativeArgs[1];

        const event = new CustomEvent("wasm-message", {
            detail: {
                source: `JS::${wasmId}::${wasmUrl}`,
                target,
                content
            },
        });

        // Dispatch the event to notify the JS side.
        window.dispatchEvent(event);
    });
    vm.setProp(vm.global,"sendMessage", sendMessageHandle);
    sendMessageHandle.dispose();

    vm.evalCode(jsCode);
}

function dispose(wasmId: string) {
    const instance = instances[wasmId];
    if (instance) {
        instance.vm.dispose();
        delete instances[wasmId];
    }
}

function sendMessage(wasmId: string, message: string) {
    const instance = instances[wasmId];
    if (instance) {
        const vm = instance.vm;
        vm.evalCode(`onMessage('${message}')`);
    }
}

export { install, sendMessage, dispose,  };

