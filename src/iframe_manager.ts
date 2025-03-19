import { installIframe } from './message_passer.ts';

// const rustAddress = (id : string) => `RAW::${id}::http://localhost:5174/rust_units/${id}/target/wasm32-unknown-unknown/release/${id}.wasm`
// const jsAddress = (id : string) => `JS::${id}::http://localhost:5174/js_units/${id}.js`
const iframeAddress = (id: string) => `IFRAME::${id}::http://localhost:5173/iframe_units/${id}/index.html`

const iframes : { 
    [key: string]: HTMLIFrameElement
} = {

}

function getIframe(id: string) {
    if (iframes[id]) {
        return iframes[id];
    }
    const iframe = installIframe(iframeAddress(id));
    iframes[id] = iframe;
    return iframe;
}


export  {getIframe};