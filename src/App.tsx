import React, { useEffect, useRef, useState } from 'react';
import { TreeComponent } from './PanelLib/VertexComponents';
import './App.css';
import CK_Debugger from './CK_Debugger/CK_Debugger';
import CreativeKernel from "./kernel/CreativeKernel";
import IframeModality from './modalities/IframeModality';
import WasmJSModality from './modalities/WasmJSModality';
import UIModality from './modalities/UIModality';
import PersistenceModality from './modalities/PersistenceModality';
import PrivilegedModality from './modalities/PrivilegedModality';
import { Button, SimpleCommittedTextInput, StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import Sidebar from './Sidebar';
import AssetViewer from './Sidebar/ContextMenus/AssetViewer';
import { debug } from './Config';
import FallbackScreen from './FallbackScreen/FallbackScreen';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };

    setIsMobile(checkMobile());
  }, []);

  return isMobile;
}



const DEBUG = debug;


const iframeModality = new IframeModality();
const wasmJSModality = new WasmJSModality();
const uiModality = new UIModality();
const persistenceModality = new PersistenceModality();
const privilegedModality = new PrivilegedModality();

const kernel = new CreativeKernel({
        iframe: iframeModality,
        wasmjs: wasmJSModality,
        ui: uiModality,
        persistence: persistenceModality,
        privileged: privilegedModality,
    },);
kernel.setEmissionMode("SILENT");
privilegedModality.appendInstance('asset_viewer', (modality) => {
    return new AssetViewer(modality);
})

globalThis.IFRAME_MODALITY = iframeModality;
globalThis.ASSET_VIEWER = privilegedModality.instanceWorkers['asset_viewer'];
globalThis.UI_MODALITY = uiModality;
globalThis.CREATIVE_KERNEL = kernel;
globalThis.PRIVILEGED_MODALITY = privilegedModality;
globalThis.PERSISTENCE_MODALITY = persistenceModality;

const DraggingAssetContext = React.createContext<[boolean, (b: boolean) => void] | null>(null);

const App: React.FC = () => {

    const [ready, setReady] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);
    const [fallback, setFallback] = React.useState({
        useFallback: false,
        h1Text: "Creative Kernel is not ready",
        pText: "Please wait while the kernel is loading.",
        buttonText: "Reload",
        onButtonClick: () => {
            window.location.reload();
        }
    });
    const isMobile = useIsMobile();

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
                setFallback({
                    useFallback: true,
                    h1Text: "This tool is undergoing maintenance",
                    pText: "The 'p5js' template is currently unavailable. Please try again later.",
                    buttonText: "Visit Homepage",
                    onButtonClick: () => {
                        window.location.href = "https://pinsandcurves.app";
                    }
                })
            }
            if (template === "cyberspaghetti") {
                setFallback({
                    useFallback: true,
                    h1Text: "This tool is undergoing maintenance",
                    pText: "The 'cyberspaghetti' template is currently unavailable. Please try again later.",
                    buttonText: "Visit Homepage",
                    onButtonClick: () => {
                        window.location.href = "https://pinsandcurves.app";
                    }
                })
                // globalThis.PERSISTENCE_MODALITY.loadSessionFromTemplate("cyberspaghetti").then(() => {
                //     setReady(true);
                // }).catch((e) => {
                //     console.error("Error loading template", e);
                //     setReady(true);
                // });
            }
            if (template === "laserlinguine") {
                setFallback({
                    useFallback: true,
                    h1Text: "This tool has been discontinued",
                    pText: "The 'laserlinguine' tool is no longer available.",
                    buttonText: "Visit Homepage",
                    onButtonClick: () => {
                        window.location.href = "https://pinsandcurves.app";
                    }
                })
            }
            if (template === "liquidlissajous") {
                globalThis.PERSISTENCE_MODALITY.loadSessionFromTemplate("liquidlissajous").then(() => {
                    setReady(true);
                }).catch((e) => {
                    console.error("Error loading template", e);
                setFallback({
                    useFallback: true,
                    h1Text: "An error occurred while loading Liquid Lissajous",
                    pText: e.message || "Please try again later.",
                    buttonText: "Reload",
                    onButtonClick: () => {
                        window.location.reload();
                    }
                })
                });
            }
        } else {
            setReady(true);
        }


    }, [])

    if (isMobile) {
        return <StyleProvider>
            <FallbackScreen
                h1Text="Pins And Curves is not available on mobile devices"
                pText="Please visit this site on a desktop or laptop computer to use Pins And Curves."
                buttonText="Visit Homepage"
                onButtonClick={() => {
                    window.location.href = "https://pinsandcurves.app";
                }}
            />
        </StyleProvider>
    }

    if (fallback.useFallback) {
        return <StyleProvider>
            <FallbackScreen
                h1Text={fallback.h1Text}
                pText={fallback.pText}
                buttonText={fallback.buttonText}
                onButtonClick={fallback.onButtonClick}
            />
            </StyleProvider>
    }

    return <DraggingAssetContext.Provider value={[dragging, setDragging]}>
    <StyleProvider>
        <div style={{
            height: "100vh",
            width: "100vw",
            padding: "5px",
            display: "grid",
            gridTemplateRows: DEBUG ? "1fr 500px" : "1fr",
        }}
        >
            <div style={{
                height: "100%",
                width: "100%",
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gridTemplateRows: "1fr",
                gridTemplateAreas: `"sidebar main"`,
                
            }}>
                <div style={{gridArea: "sidebar", width: "100%", height: "100%"}}
                >
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
            {DEBUG && <CK_Debugger kernel={kernel} />}
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
    </DraggingAssetContext.Provider>
}

function useDraggingAssetContext() {    
    const context = React.useContext(DraggingAssetContext);
    if (!context) {
        throw new Error("useDraggingAssetContext must be used within a DraggingAssetProvider");
    }
    return context;
}

export { useDraggingAssetContext };

export default App;

