import * as JS from './quickjs_wrapper';
import * as RAW from './raw_wrapper';
import * as IFRAME from './iframe_wrapper';

const registry : string[] = ["CORE::CORE::CORE"];

window.addEventListener("wasm-message", async (event: Event) => {
    const { source, target, content } = (event as CustomEvent).detail;

    // Check if the target is already registered
    // console.log(event)
    // console.log(registry,target)

    if (!registry.includes(target)) {
        await install(target);
        console.log(`INSTALLED ${target}`);
    }


    const [_1, source_id, _2] = source.split('::');
    const [_3, target_id, _4] = target.split('::');

    console.log(`MESSAGE ${source_id} --> ${target_id}:\n\n${content}`);

    if (target !== 'CORE::CORE::CORE') {
        const [type,id, location] = target.split('::');
        if (type === 'IFRAME') {
            IFRAME.sendMessage(id, JSON.stringify({ source, content }));
        }
        if (type === 'RAW') {
            RAW.sendMessage(id, JSON.stringify({ source, content }));
        }
        if (type === 'JS') {
            JS.sendMessage(id, JSON.stringify({ source, content }));
        }
    }
});

async function install(address: string) {
    const [type, id, location] = address.split('::');
    if (type === 'JS') {
        await JS.install(id, location);
        registry.push(address);
    }
    if (type === 'RAW') {
        await RAW.install(id, location);
        registry.push(address);
    }
}

function installIframe(address: string) {
    const [type, id, location] = address.split('::');
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', location)
    IFRAME.install(iframe, id);
    registry.push(address);
    return iframe;
}


function dispose(wasmId: string) {
    const [type,id,location] = wasmId.split('::');
    if (type === 'JS') {
        JS.dispose(id);
    }
    if (type === 'RAW') {
        RAW.dispose(id);
    }
    if (type === 'IFRAME') {
        IFRAME.dispose(id);
    }
}

function sendMessageFromCore(target: string, content: string) {
    const e = new CustomEvent("wasm-message", {
        detail: {
            source: 'CORE::CORE::CORE',
            target,
            content
        },
    });
    window.dispatchEvent(e);
}

export { sendMessageFromCore, installIframe, dispose };