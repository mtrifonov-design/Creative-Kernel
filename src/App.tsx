import React, { useEffect, useRef } from 'react';
import { TreeComponent } from './PanelLib/VertexComponents';
import './App.css';
import CK_Debugger from './CK_Debugger/CK_Debugger';
import CreativeKernel from "./kernel/kernel";
import IframeModality from './modalities/IframeModality';
import WasmJSModality from './modalities/WasmJSModality';
import UIModality from './modalities/UIModality';
import PersistenceModality from './modalities/PersistenceModality';
import { Button, SimpleCommittedTextInput, StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import Sidebar from './Sidebar';

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
kernel.setRunning(!DEBUG);

globalThis.IFRAME_MODALITY = iframeModality;
globalThis.UI_MODALITY = uiModality;
globalThis.CREATIVE_KERNEL = kernel;
globalThis.PERSISTENCE_MODALITY = persistenceModality;

const App: React.FC = () => {

    const [ready, setReady] = React.useState(false);

    const guard = useRef(false);
    useEffect(() => {
        if (guard.current) {
            return;
        }
        guard.current = true;
        // parse the URL and get the parameters
        const urlParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlParams.entries());

        // if template is set, load the template
        if (params.template) {
            const template = params.template;
            if (template === "default") {
                globalThis.PERSISTENCE_MODALITY.loadSessionFromTemplate("default").then(() => {
                    setReady(true);
                }).catch((e) => {
                    console.error("Error loading template", e);
                    setReady(true);
                });
            }
            if (template === "forsasha") {
                globalThis.PERSISTENCE_MODALITY.loadSessionFromTemplate("forsasha").then(() => {
                    setReady(true);
                }).catch((e) => {
                    console.error("Error loading template", e);
                    setReady(true);
                });
            }
            if (template === "cyberspaghetti") {
                globalThis.PERSISTENCE_MODALITY.loadSessionFromTemplate("cyberspaghetti").then(() => {
                    setReady(true);
                }).catch((e) => {
                    console.error("Error loading template", e);
                    setReady(true);
                });
            }
            if (template === "laserlinguine") {
                globalThis.PERSISTENCE_MODALITY.loadSessionFromTemplate("laserlinguine").then(() => {
                    setReady(true);
                }).catch((e) => {
                    console.error("Error loading template", e);
                    setReady(true);
                });
            }
        } else {
            setReady(true);
        }


    }, [])
    return <StyleProvider>
        <div style={{
            height: "100vh",
            width: "100vw",
            padding: "5px",
            display: "grid",
            gridTemplateRows: DEBUG ? "1fr 500px" : "1fr",
        }}>
            <div style={{
                height: "100%",
                width: "100%",
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gridTemplateRows: "1fr",
                gridTemplateAreas: `"sidebar main"`,
                
            }}>
                <div style={{gridArea: "sidebar", width: "100%", height: "100%"}}>
                    <Sidebar />
                </div>
                <div style={{
                    gridArea: "main",
                    height: "100%",
                    width: "100%",
                    display: "grid",
                    boxSizing: "border-box",
                    gridTemplateRows: "1fr",
                }}>
                    <TreeComponent />
                </div>
            </div>
            {DEBUG && <CK_Debugger />}
        </div>
        <div style={{
            width: "100vw",
            height: "100vh",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: ready ? -1000 : 1000,
        }}
            onPointerDown={(e) => {
                if (!ready) {
                    e.stopPropagation();   // optional: keep the event from bubbling
                }
            }}
        ></div>
    </ StyleProvider>
}
export default App;

