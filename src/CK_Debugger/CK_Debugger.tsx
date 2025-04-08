import React, { createContext, useSyncExternalStore } from "react";
import CK_ThreadsPage from "./CK_ThreadsPage";
import CK_InstancesPage from "./CK_InstancesPage";

const getThreadSnapshot = () => {
    const kernel = (window as any).CREATIVE_KERNEL;
    return kernel.getThreads();
}

const getRegistrySnapshot = () => {
    const kernel = (window as any).CREATIVE_KERNEL;
    return kernel.getRegistry();
}

const getRunningSnapshot = () => {
    const kernel = (window as any).CREATIVE_KERNEL;
    return kernel.getRunning();
}

const subscribe = (callback: () => void) => {
    const kernel = (window as any).CREATIVE_KERNEL;
    const unsubscribe = kernel.subscribe(callback);
    return () => {
        unsubscribe();
    }
}

function CK_Page({page}: {page: string}) {
    //console.log("Page", page);
    if (page === "instances") {
        return <CK_InstancesPage />
    }
    if (page === "threads") {
        return <CK_ThreadsPage />
    }
    return <div>Not found.</div>
}

const ThreadContext = createContext(null);
const RegistryContext = createContext(null);    
function CK_Debugger() {

    const threads = useSyncExternalStore(subscribe, getThreadSnapshot)
    const registry = useSyncExternalStore(subscribe, getRegistrySnapshot)

    const [currentPage, setCurrentPage] = React.useState("threads");

    const running = useSyncExternalStore(subscribe, getRunningSnapshot);





    const toggleRunning = () => {
        const kernel = (window as any).CREATIVE_KERNEL;
        kernel.setRunning(!kernel.getRunning());
    }


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
                <div style={{
                    display: "flex",
                    gap: "10px",
                }}>
                    DEBUGGER
                    <button onClick={toggleRunning}>{running? "running mode" : "step-through mode"}</button>
                </div>
                <div style={{
                    display: "flex",
                    gap: "10px",
                }}>
                    <div
                        style={{
                            cursor: "pointer",
                            fontWeight: currentPage === "threads" ? "bold" : "normal",
                            textDecoration: currentPage === "threads" ? "underline" : "none",
                        }}
                        onClick={() => setCurrentPage("threads")}   
                    >Threads</div>
                    <div
                        style={{
                            cursor: "pointer",
                            fontWeight: currentPage === "instances" ? "bold" : "normal",
                            textDecoration: currentPage === "instances" ? "underline" : "none",
                        }}
                        onClick={() => setCurrentPage("instances")}   
                    >Instances</div>
                </div>
                <CK_Page page={currentPage} />


                {/* Add more UI elements here */}
            </div>
        </ThreadContext.Provider>
        </RegistryContext.Provider>
    );
}

export { ThreadContext, RegistryContext };
export default CK_Debugger;