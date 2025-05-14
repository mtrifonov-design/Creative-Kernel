import { useState, useSyncExternalStore } from "react";
import CK_ThreadsPage from "./CK_ThreadsPage";
import { CK_Unit } from "../kernel/types";

interface CreativeKernel {
    getThreads: () => { [key: string]: CK_Unit[] };
    getPendingWorkloads: () => { [key: string]: CK_Unit[] }[];
    subscribe: (callback: () => void) => () => void;
    step: () => void;
}

declare global {
    interface Window {
        CREATIVE_KERNEL: CreativeKernel;
    }
}

const getSnapshot = () => {
    return window.CREATIVE_KERNEL.getSnapshot();
};

const subscribe = (callback: () => void) => {
    return window.CREATIVE_KERNEL.subscribe(callback);
};

function CK_Debugger() {
    const { plate, pending } = useSyncExternalStore(subscribe, getSnapshot);
    console.log("plate", plate);
    console.log("pending", pending);

    const [mode, setMode] = useState("STEP");

    const handleStep = () => {
        window.CREATIVE_KERNEL.step();
    };

    return (
        <div style={{ padding: "10px", backgroundColor: "white" }}>
            <h1>CK Debugger</h1>

            <div style={{ marginBottom: "10px" }}>
                <label>Mode: </label>
                <select value={mode} onChange={(e) => {
                    setMode(e.target.value)
                    globalThis.CREATIVE_KERNEL.setEmissionMode(e.target.value)    
                }}>
                    <option value="STEP">STEP</option>
                    <option value="WORKLOAD">WORKLOAD</option>
                    <option value="SILENT">CONTINUOUS</option>
                </select>
            </div>

            <button onClick={handleStep}>DO STEP</button>

            <div style={{ marginTop: "20px" }}>
                <h2>Current Plate</h2>
                <CK_ThreadsPage threads={plate} />
            </div>

            <div style={{ marginTop: "20px" }}>
                <h2>Pending Workloads</h2>
                <pre>{JSON.stringify(pending, null, 2)}</pre>
            </div>
        </div>
    );
}

export default CK_Debugger;