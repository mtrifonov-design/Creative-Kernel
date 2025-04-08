import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { sendMessageFromCore, installIframe } from './message_passer.ts';


// const rustAddress = (id : string) => `RAW::${id}::http://localhost:5173/rust_units/${id}/target/wasm32-unknown-unknown/release/${id}.wasm`
// const jsAddress = (id : string) => `JS::${id}::http://localhost:5173/js_units/${id}.js`
// const iframeAddress = (id: string) => `IFRAME::${id}::http://localhost:5173/iframe_units/${id}/index.html`

// function globalSend(type: string, id: string, content: string) {
//     let address = '';
//     if (type === 'r') {
//         address = rustAddress(id);
//     }
//     if (type === 'j') {
//         address = jsAddress(id);
//     }
//     if (type === 'i') {
//         address = iframeAddress(id);
//     }
//     sendMessageFromCore(address, content);
// }

// (window as any).send = globalSend;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
