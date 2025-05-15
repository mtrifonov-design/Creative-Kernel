import { useState } from "react";
import { useSyncExternalStore } from "react";
import ModeSelector from "./ModeSelector";
import Tabs from "./Tabs";
import ThreadsRenderer from "./ThreadsRenderer";
import UnitDetails from "./UnitDetails";
import RecordingControls from "./RecordingControls";
import { getSnapshot, subscribe } from "./utils";
import { CK_Unit } from "../kernel/types";
import CreativeKernel from "../kernel/CreativeKernel";
import RecordingSideEffect from "../kernel/sideEffects/RecordingSideEffect";
import Instances from "./Instances";

declare global {
    interface Global {
        CREATIVE_KERNEL: CreativeKernel;
    }
    let CREATIVE_KERNEL: CreativeKernel;

    interface Window {
        CREATIVE_KERNEL: CreativeKernel;
    }
}

const kernel = window.CREATIVE_KERNEL;

function CK_Debugger() {
    const { plate, pending, mode, instances } = useSyncExternalStore(subscribe, getSnapshot);
    const setMode = (newMode: string) => {
        window.CREATIVE_KERNEL.setEmissionMode(newMode);
    };

    const [view, setView] = useState<string | number>("current");
    const [selectedUnit, setSelectedUnit] = useState<CK_Unit | null>(null);

    const handleStep = () => {
        if (view === "current") {
            if (mode === "STEP") {
                window.CREATIVE_KERNEL.step();
            } else if (mode === "WORKLOAD") {
                window.CREATIVE_KERNEL.step();
            }
        }
    };


    const handleUnitHover = (unit: CK_Unit | null) => {
        setSelectedUnit(unit);
    };

    const firstUnit = plate && Object.values(plate)[0]?.[0];

    return (
        <div style={{ padding: "10px", backgroundColor: "white", display: "flex", flexDirection: "column" }}>
            <div style={{ 
                display: "flex", 
                gap: "10px", 
                alignItems: "center",
                justifyContent: "flex-start",    
            }}>
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
                <div style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                }}>
                    <ModeSelector mode={mode} setMode={setMode} />
                </div>
                <RecordingControls />
            </div>

            <hr />

            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "20px",
                justifyContent: "space-between",
                width: "100%",
                height: "100%",
            }}>
                <div style={{
                    width: "100%",
                }}>
                    <Tabs pending={pending} view={view} setView={setView} />

                    {view === "current" ? (
                        <div>
                            <h2>Current Plate</h2>
                            <ThreadsRenderer threads={plate} handleUnitHover={handleUnitHover} />
                        </div>
                    ) : (
                        <div style={{
                            width: "100%",
                        }}>
                            <h2>Pending Workload {typeof view === "number" ? view + 1 : ""}</h2>
                            <ThreadsRenderer threads={pending[view as number]} handleUnitHover={handleUnitHover} />
                        </div>
                    )}
                </div>
                 <UnitDetails selectedUnit={selectedUnit} firstUnit={firstUnit} />
                 <Instances instances={instances} />
            </div>




           
        </div>
    );
}

export default CK_Debugger;