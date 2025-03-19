const instances : {
    [wasmId: string]: WebAssembly.Instance;
} = {};

async function install(wasmId : string, wasmUrl : string) {
    // Define our JS "imports" for the WASM module.

    const importObject = {
        env: {
            send_message: (ptr : number, len: number) => {
                // 1. Access the WASM memory buffer.
                    // @ts-ignore
                const memoryBuffer = instance.exports.memory.buffer;

                // 2. Extract the bytes corresponding to [ptr, ptr+len].
                const bytes = new Uint8Array(memoryBuffer, ptr, len);

                // 3. Decode to a JavaScript string.
                const message = new TextDecoder("utf-8").decode(bytes);

                // 4. Log it (or do anything else you want).
                // console.log("Received from Rust:", message);
                // console.log("Received from Rust:", message);
                const json = JSON.parse(message);
                const { target, content } = json;

                const event = new CustomEvent("wasm-message", {
                    detail: {
                        source: `RAW::${wasmId}::${wasmUrl}`,
                        target,
                        content
                    },
                });

                // 5. Tell Rust we're done with this buffer so it can be freed.
                    // @ts-ignore
                instance.exports.free_buffer(ptr, len);

                // Dispatch the event to notify the JS side.
                window.dispatchEvent(event);
            },
        },
    };

    // Load and instantiate the .wasm file (replace 'my_module.wasm' with your actual file).
    const response = await fetch(wasmUrl);
    const { instance } = await WebAssembly.instantiateStreaming(response, importObject);
    // @ts-ignore
    instance.exports.init_on_message();

    instances[wasmId] = instance;
}

function sendMessage(wasmId : string, message : string) {
    const wasmInstance = instances[wasmId];
    // 1. Encode the string as UTF-8 bytes
    const encoded = new TextEncoder().encode(message);

    // 2. Allocate memory in Rust
        // @ts-ignore
    const ptr = wasmInstance.exports.allocate(encoded.length);

    // 3. Copy the bytes into WASM memory
        // @ts-ignore
    const memoryView = new Uint8Array(wasmInstance.exports.memory.buffer, ptr, encoded.length);
    memoryView.set(encoded);

    // 4. Call the exported Rust function, passing pointer + length
        // @ts-ignore
    wasmInstance.exports.on_message_raw(ptr, encoded.length);
}

function dispose(wasmId : string) {
    const instance = instances[wasmId];
    if (instance) {
        delete instances[wasmId];
    }
};

// function onMessage(callback: Function) {
//     window.addEventListener("wasm-message", (event : Event) => {
//         // @ts-ignore
//         const { source, target, content } = event.detail;
//         callback(source, target, content );
//     });
// }


export { install, sendMessage, dispose,  };


