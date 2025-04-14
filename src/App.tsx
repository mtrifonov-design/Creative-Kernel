import React from 'react';
import { TreeComponent } from './PanelLib/VertexComponents';
import './App.css';
import CK_Debugger from './CK_Debugger/CK_Debugger';
import CreativeKernel from "./kernel/kernel";
import IframeModality from './modalities/IframeModality';
import WasmJSModality from './modalities/WasmJSModality';
import UIModality from './modalities/UIModality';
import PersistenceModality from './modalities/PersistenceModality';


const DEBUG = false;


const iframeModality = new IframeModality();
const wasmJSModality = new WasmJSModality();
const uiModality = new UIModality();
const persistenceModality = new PersistenceModality();
const kernel = new CreativeKernel({
    modalities: {
        iframe: iframeModality,
        wasmjs: wasmJSModality,
        ui: uiModality,
        persistence: persistenceModality,
    },
    snapshot: null,
});
kernel.setRunning(true);

globalThis.IFRAME_MODALITY = iframeModality;
globalThis.UI_MODALITY = uiModality;
globalThis.CREATIVE_KERNEL = kernel;
globalThis.PERSISTENCE_MODALITY = persistenceModality;

const App: React.FC = () => {
    return <div style={{
        height: "100%",
        width: "100%",
        display: "grid",
        boxSizing: "border-box",
        
        gridTemplateRows: DEBUG ? "1fr 500px" : "1fr",
    }}>
            <TreeComponent />
            {DEBUG && <CK_Debugger />}
    </div>
}
export default App;

