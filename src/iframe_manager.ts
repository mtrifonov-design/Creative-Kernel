import { installIframe } from './message_passer.ts';
import { dispose } from './quickjs_wrapper.ts';

// const rustAddress = (id : string) => `RAW::${id}::http://localhost:5174/rust_units/${id}/target/wasm32-unknown-unknown/release/${id}.wasm`
// const jsAddress = (id : string) => `JS::${id}::http://localhost:5174/js_units/${id}.js`

const iframes : { 
    [key: string]: HTMLIFrameElement
} = {

}

function getIframe(id: string, url?: string) {

    if (url) {
        // change or install
        const address = `IFRAME::${id}::${url}`;
        dispose(address);
        const iframe = installIframe(address);
        iframes[id] = iframe;
        return iframe;
    } else {
        // get
        return iframes[id];
    }
}


export  {getIframe};