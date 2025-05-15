import { useState } from "react";
import { useSyncExternalStore } from "react";
import ModeSelector from "./ModeSelector";
import Tabs from "./Tabs";
import ThreadsRenderer from "./ThreadsRenderer";
import UnitDetails from "./UnitDetails";
import { getSnapshot, subscribe } from "./utils";
import { CK_Unit } from "../kernel/types";

interface CreativeKernel {
    getThreads: () => { [key: string]: CK_Unit[] };
    getPendingWorkloads: () => { [key: string]: CK_Unit[] }[];
    subscribe: (callback: () => void) => () => void;
    step: () => void;
    setEmissionMode: (mode: string) => void;
    getSnapshot: () => { plate: { [key: string]: CK_Unit[] }; pending: { [key: string]: CK_Unit[] }[] }; // Added this method
}

declare global {
    interface Global {
        CREATIVE_KERNEL: CreativeKernel;
    }
    let CREATIVE_KERNEL: CreativeKernel;

    interface Window {
        CREATIVE_KERNEL: CreativeKernel;
    }
}



function CK_Debugger() {
    const { plate, pending, mode } = useSyncExternalStore(subscribe, getSnapshot);
    const setMode = (nM: string) => globalThis.CREATIVE_KERNEL.setEmissionMode(nM);
    const [view, setView] = useState<string | number>("current"); // 'current' or index of pending workload
    const [selectedUnit, setSelectedUnit] = useState<CK_Unit | null>(null);

    const handleStep = () => {
        if (view === "current") {
            if (mode === "STEP") {
                window.CREATIVE_KERNEL.step();
            } else if (mode === "WORKLOAD") {
                // Logic for finishing workload
                window.CREATIVE_KERNEL.step();
            } 
        }
    };

    const handleUnitHover = (unit: CK_Unit | null) => {
        setSelectedUnit(unit);
    };

    const firstUnit = plate && Object.values(plate)[0]?.[0];

    return (
        <div style={{ padding: "10px", backgroundColor: "white", display: "flex" }}>
            <div style={{ flex: 1 }}>
                <h1>CK Debugger</h1>

                <ModeSelector mode={mode} setMode={setMode} />

                <button
                    onClick={handleStep}
                    disabled={view !== "current" || mode === "SILENT"}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: view === "current" && mode !== "SILENT" ? "#007bff" : "#ccc",
                        color: "white",
                        border: "none",
                        cursor: view === "current" && mode !== "SILENT" ? "pointer" : "not-allowed",
                    }}
                >
                    {mode === "STEP" ? "Step" : mode === "WORKLOAD" ? "Finish Workload" : "Silent"}
                </button>

                <div style={{ marginTop: "20px" }}>
                    <Tabs pending={pending} view={view} setView={setView} />

                    {view === "current" ? (
                        <div>
                            <h2>Current Plate</h2>
                            <ThreadsRenderer threads={plate} handleUnitHover={handleUnitHover} />
                        </div>
                    ) : (
                        <div>
                            <h2>Pending Workload {typeof view === "number" ? view + 1 : ""}</h2>
                            <ThreadsRenderer threads={pending[view as number]} handleUnitHover={handleUnitHover} />
                        </div>
                    )}
                </div>
            </div>

            <UnitDetails selectedUnit={selectedUnit} firstUnit={firstUnit} />
        </div>
    );
}

export default CK_Debugger;