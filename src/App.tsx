import React from 'react';
import { TreeComponent } from './PanelLib/VertexComponents';
import './App.css';
import CK_Debugger from './CK_Debugger/CK_Debugger';
import CreativeKernel from "./kernel/kernel";
import IframeModality from './modalities/IframeModality';
import WasmJSModality from './modalities/WasmJSModality';
import UIModality from './modalities/UIModality';

const iframeModality = new IframeModality();
const wasmJSModality = new WasmJSModality();
const uiModality = new UIModality();
const kernel = new CreativeKernel({
    modalities: {
        iframe: iframeModality,
        wasmjs: wasmJSModality,
        ui: uiModality,
    },
    snapshot: null,
});

globalThis.IFRAME_MODALITY = iframeModality;
globalThis.UI_MODALITY = uiModality;
globalThis.CREATIVE_KERNEL = kernel;

const App: React.FC = () => {
    return <div style={{
        height: "100vh",
        width: "100vw",
        display: "grid",
        gridTemplateRows: "2fr 1fr",
    }}>
            <TreeComponent />
            <CK_Debugger />
    </div>
}
export default App;

