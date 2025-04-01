import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'



import CreativeKernel from "./kernel/kernel";
import { CK_Threads } from "./kernel/types";
import { CK_Instance } from "./kernel/types";
import { MockModality } from "./modalities/MockModality";
import DebugDevice from "./debug_devices/DebugDevice";
import { renderThreads } from "./integration_testing/browser/debugView";
import { ResourceA } from "./integration_testing/browser/resources";

const modality = new MockModality();
const debugDevice = new DebugDevice();
const kernel = new CreativeKernel({
    modalities: {
        mock: modality,
    },
    debugDevice: debugDevice,
    snapshot: null,
});


const unit : CK_Unit = {
    type: "install",
    instance: {
        modality: "mock",
        resource_id: "resourceA",
        instance_id: "test_instance",
    },
};
modality.addResource("resourceA", ResourceA);
console.log("Im here")

const threadId = "test_thread";
kernel.pushUnit(threadId,unit);

renderThreads( kernel);







import { sendMessageFromCore, installIframe } from './message_passer.ts';


const rustAddress = (id : string) => `RAW::${id}::http://localhost:5173/rust_units/${id}/target/wasm32-unknown-unknown/release/${id}.wasm`
const jsAddress = (id : string) => `JS::${id}::http://localhost:5173/js_units/${id}.js`
const iframeAddress = (id: string) => `IFRAME::${id}::http://localhost:5173/iframe_units/${id}/index.html`

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
