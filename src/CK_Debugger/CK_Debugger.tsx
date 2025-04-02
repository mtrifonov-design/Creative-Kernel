import React, { createContext, useSyncExternalStore } from "react";
import CK_ThreadsPage from "./CK_ThreadsPage";

const getThreadSnapshot = () => {
    const kernel = (window as any).CREATIVE_KERNEL;
    return kernel.getThreads();
}

const getRegistrySnapshot = () => {
    const kernel = (window as any).CREATIVE_KERNEL;
    return kernel.getRegistry();
}

const subscribe = (callback: () => void) => {
    const kernel = (window as any).CREATIVE_KERNEL;
    const unsubscribe = kernel.subscribe(callback);
    return () => {
        unsubscribe();
    }
}

function CK_Page() {
    return <CK_ThreadsPage />
}

const ThreadContext = createContext(null);
const RegistryContext = createContext(null);    
function CK_Debugger() {

    const threads = useSyncExternalStore(subscribe, getThreadSnapshot)
    const registry = useSyncExternalStore(subscribe, getRegistrySnapshot)


    return (
        <RegistryContext.Provider value={registry}>
        <ThreadContext.Provider value={threads}>
            <div style={{
                border: "1px solid black",
                padding: "5px",
                display: "grid",
                gridTemplateRows: "20px 20px 1fr",
                height: "400px",
            }}>
                <div>DEBUGGER</div>
                <div>PAGES</div>
                <CK_Page />


                {/* Add more UI elements here */}
            </div>
        </ThreadContext.Provider>
        </RegistryContext.Provider>
    );
}

export { ThreadContext, RegistryContext };
export default CK_Debugger;