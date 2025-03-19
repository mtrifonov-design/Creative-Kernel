
import { sendMessageFromCore, installIframe } from './message_passer.ts';

const rustAddress = (id : string) => `RAW::${id}::http://localhost:5174/rust_units/${id}/target/wasm32-unknown-unknown/release/${id}.wasm`
const jsAddress = (id : string) => `JS::${id}::http://localhost:5174/js_units/${id}.js`
const iframeAddress = (id: string) => `IFRAME::${id}::http://localhost:5174/iframe_units/${id}/index.html`


// sendMessageFromCore('JS::test_js', 'Hello from core!');
// sendMessageFromCore('RAW::test_engine', 'Sunny day!');

// sendMessageFromCore(rustAddress('test_engine'), 'Hello from core!');
// sendMessageFromCore(jsAddress('test_js'), 'Hello from core!');


const iframe = installIframe(iframeAddress('test_iframe'));
document.body.appendChild(iframe);

function globalSend(type: string, id: string, content: string) {
    let address = '';
    if (type === 'r') {
        address = rustAddress(id);
    }
    if (type === 'j') {
        address = jsAddress(id);
    }
    if (type === 'i') {
        address = iframeAddress(id);
    }
    sendMessageFromCore(address, content);
}

(window as any).send = globalSend;