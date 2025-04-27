import React, { useEffect, useRef } from 'react';
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
        } else {
            setReady(true);
        }


    }, [])

    //console.log(ready)

    const [projectName, setProjectName] = React.useState("Project Name");
    return <>
        <div style={{
            height: "100%",
            width: "100%",
            display: "grid",
            boxSizing: "border-box",
            gridTemplateRows: DEBUG ? "30px 1fr 500px" : "30px 1fr",

        }}>


            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "5px" }}>
                <input type="text" value={projectName} onChange={(event) => {
                    const target = event.target as HTMLInputElement;
                    setProjectName(target.value);
                }}></input>
                <button onClick={() => globalThis.PERSISTENCE_MODALITY.saveSession(projectName)}>Save session</button>
                <button onClick={async () => {
                    const projectName = await globalThis.PERSISTENCE_MODALITY.loadSession()
                    if (projectName) {
                        setProjectName(projectName);
                    }
                }}>Load session</button>
            </div>
            <TreeComponent />
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
    </>
}
export default App;

