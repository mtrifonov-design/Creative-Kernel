import * as JS from './quickjs_wrapper';
import * as RAW from './raw_wrapper';
import * as IFRAME from './iframe_wrapper';

const registry : string[] = ["CORE::CORE::CORE"];

const processEvent = async (event: Event) => {
    const { source, target, content } = (event as CustomEvent).detail;

    // Check if the target is already registered
    // //console.log(event)
    // //console.log(registry,target)
    if (target === 'CORE::CORE::CORE') {
        console.log("LOG",source,content);
        return
    }

    if (!registry.includes(target)) {
        await install(target);
        // console.log("REGISTRY",JSON.stringify(registry));
        // console.log(`INSTALLED ${target}`);
    }


    const [_1, source_id, _2] = source.split('::');
    const [_3, target_id, _4] = target.split('::');

    //console.log("REGISTRY",JSON.stringify(registry));
    // shorten the message
    const prettyMessage = JSON.stringify(content, null, 2).slice(0, 100);

    console.log(`MESSAGE ${source_id} --> ${target_id}:\n\n${prettyMessage}`);

    if (target !== 'CORE::CORE::CORE') {
        const [type,id, location] = target.split('::');
        if (type === 'IFRAME') {
            IFRAME.sendMessage(target, { source, content });
        }
        if (type === 'RAW') {
            RAW.sendMessage(target, JSON.stringify({ source, content }));
        }
        if (type === 'JS') {
            JS.sendMessage(target, JSON.stringify({ source, content }));
        }
    }
}


const queue = [] 
function queueEvent(e: Event) {
    queue.push(e);
    if (queue.length !== 0) {
        processQueue();
    }
}

let processing = false;
async function processQueue() {
    if (processing) {
        return;
    }
    processing = true;
    while (queue.length > 0) {
        const event = queue.shift();
        if (event) {
            await processEvent(event);
        }
    }
    processing = false;
}




window.addEventListener("mog-message", event => queueEvent(event));

async function install(address: string) {
    const [type, id, location] = address.split('::');
    if (type === 'JS') {
        await JS.install(address, location);
        registry.push(address);
    }
    if (type === 'RAW') {
        await RAW.install(address, location);
        registry.push(address);
    }
}

function installIframe(address: string) {
    const [type, id, location] = address.split('::');
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', location)
    IFRAME.install(iframe, address);
    registry.push(address);
    return iframe;
}


function dispose(address: string) {
    const [type,id,location] = address.split('::');
    if (type === 'JS') {
        JS.dispose(address);
    }
    if (type === 'RAW') {
        RAW.dispose(address);
    }
    if (type === 'IFRAME') {
        IFRAME.dispose(address);
    }
}

function sendMessageFromCore(target: string, content: string) {
    const e = new CustomEvent("mog-message", {
        detail: {
            source: 'CORE::CORE::CORE',
            target,
            content
        },
    });
    window.dispatchEvent(e);
}

export { sendMessageFromCore, installIframe, dispose };