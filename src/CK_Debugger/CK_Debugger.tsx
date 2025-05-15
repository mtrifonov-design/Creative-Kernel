import { useState } from "react";
import { useSyncExternalStore } from "react";
import ModeSelector from "./ModeSelector";
import Tabs from "./Tabs";
import ThreadsRenderer from "./ThreadsRenderer";
import UnitDetails from "./UnitDetails";
import { getSnapshot, subscribe } from "./utils";
import { CK_Unit } from "../kernel/types";
import CreativeKernel from "../kernel/CreativeKernel";

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

    console.log(plate, pending, mode);
    const setEmissionMode = (nM: string) => {
        console.log("Setting emission mode to:", nM);
            window.CREATIVE_KERNEL.setEmissionMode(nM);
    };
    const [view, setView] = useState<string | number>("current"); // 'current' or index of pending workload
    const [selectedUnit, setSelectedUnit] = useState<CK_Unit | null>(null);
    const [isRecording, setIsRecording] = useState(false);

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

    const handleToggleRecording = () => {
        if (isRecording) {
            window.CREATIVE_KERNEL.stopRecording();
        } else {
            window.CREATIVE_KERNEL.startRecording();
        }
        setIsRecording(!isRecording);
    };

    const handleSaveRecording = () => {
        const json = window.CREATIVE_KERNEL.serializeRecordingToJson();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "recording.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadRecording = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                window.CREATIVE_KERNEL.loadRecordingFromJson(content);
            };
            reader.readAsText(file);
        }
    };

    const handlePushRecording = () => {
        window.CREATIVE_KERNEL.pushRecordingToPending();
        setView("current");
    };

    const handleUnitHover = (unit: CK_Unit | null) => {
        setSelectedUnit(unit);
    };

    const firstUnit = plate && Object.values(plate)[0]?.[0];

    return (
        <div style={{ padding: "10px", backgroundColor: "white", display: "flex" }}>
            <div style={{ flex: 1 }}>
                <h1>CK Debugger</h1>

                <ModeSelector mode={mode} setMode={setEmissionMode} />

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
                    <button onClick={handleToggleRecording} style={{ marginRight: "10px" }}>
                        {isRecording ? "Stop Recording" : "Start Recording"}
                    </button>
                    <button onClick={handleSaveRecording} style={{ marginRight: "10px" }}>
                        Save Recording to JSON
                    </button>
                    <label style={{ marginRight: "10px" }}>
                        Load Recording from JSON
                        <input type="file" accept=".json" onChange={handleLoadRecording} style={{ display: "none" }} />
                    </label>
                    <button onClick={handlePushRecording}>
                        Push Recording to Pending
                    </button>
                </div>

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