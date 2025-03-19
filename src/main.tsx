import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { sendMessageFromCore, installIframe } from './message_passer.ts';
import * as T from './PanelLib/VertexOperations.ts';


window.T = T;





const rustAddress = (id : string) => `RAW::${id}::http://localhost:5173/rust_units/${id}/target/wasm32-unknown-unknown/release/${id}.wasm`
const jsAddress = (id : string) => `JS::${id}::http://localhost:5173/js_units/${id}.js`
const iframeAddress = (id: string) => `IFRAME::${id}::http://localhost:5173/iframe_units/${id}/index.html`


// sendMessageFromCore('JS::test_js', 'Hello from core!');
// sendMessageFromCore('RAW::test_engine', 'Sunny day!');

// sendMessageFromCore(rustAddress('test_engine'), 'Hello from core!');
// sendMessageFromCore(jsAddress('test_js'), 'Hello from core!');

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
