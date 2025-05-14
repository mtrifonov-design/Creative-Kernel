import { useState, useSyncExternalStore } from "react";
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

const getSnapshot = () => {
    return window.CREATIVE_KERNEL.getSnapshot();
};

const subscribe = (callback: () => void) => {
    return window.CREATIVE_KERNEL.subscribe(callback);
};

function CK_Debugger() {
    const { plate, pending } = useSyncExternalStore(subscribe, getSnapshot);
    const [mode, setMode] = useState("STEP");
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

    const renderThreads = (threads: { [key: string]: CK_Unit[] }) => {
        return Object.entries(threads).map(([threadName, units]) => (
            <div key={threadName} style={{ marginBottom: "10px" }}>
                <h3>{threadName}</h3>
                <div style={{ display: "flex", gap: "5px" }}>
                    {units.map((unit, index) => (
                        <div
                            key={index}
                            style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: "blue",
                                cursor: "pointer",
                            }}
                            onMouseEnter={() => handleUnitHover(unit)}
                            onMouseLeave={() => handleUnitHover(null)}
                        ></div>
                    ))}
                </div>
            </div>
        ));
    };

    const renderTabs = () => {
        const tabs = pending.slice(0, 10).map((_, index) => (
            <button
                key={index}
                onClick={() => setView(index)}
                style={{
                    padding: "5px 10px",
                    margin: "0 5px",
                    backgroundColor: view === index ? "#ddd" : "#fff",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                }}
            >
                Workload {index + 1}
            </button>
        ));

        if (pending.length > 10) {
            tabs.push(
                <span key="hidden" style={{ marginLeft: "10px" }}>
                    {pending.length - 10} workloads hidden
                </span>
            );
        }

        return tabs;
    };

    const firstUnit = plate && Object.values(plate)[0]?.[0];

    return (
        <div style={{ padding: "10px", backgroundColor: "white", display: "flex" }}>
            <div style={{ flex: 1 }}>
                <h1>CK Debugger</h1>

                <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
                    <button
                        onClick={() => setMode("STEP")}
                        style={{
                            padding: "5px 10px",
                            backgroundColor: mode === "STEP" ? "#ddd" : "#fff",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                        }}
                    >
                        STEP
                    </button>
                    <button
                        onClick={() => setMode("WORKLOAD")}
                        style={{
                            padding: "5px 10px",
                            backgroundColor: mode === "WORKLOAD" ? "#ddd" : "#fff",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                        }}
                    >
                        WORKLOAD
                    </button>
                </div>

                <button
                    onClick={handleStep}
                    disabled={view !== "current"}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: view === "current" ? "#007bff" : "#ccc",
                        color: "white",
                        border: "none",
                        cursor: view === "current" ? "pointer" : "not-allowed",
                    }}
                >
                    {mode === "STEP" ? "Step" : "Finish Workload"}
                </button>

                <div style={{ marginTop: "20px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>{renderTabs()}</div>

                    {view === "current" ? (
                        <div>
                            <h2>Current Plate</h2>
                            {renderThreads(plate)}
                        </div>
                    ) : (
                        <div>
                            <h2>Pending Workload {typeof view === "number" ? view + 1 : ""}</h2>
                            {renderThreads(pending[view as number])}
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{
                    width: "300px",
                    marginLeft: "20px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    backgroundColor: "#f9f9f9",
                }}
            >
                <h2>Unit Details</h2>
                {selectedUnit || firstUnit ? (
                    <pre>{JSON.stringify(selectedUnit || firstUnit, null, 2)}</pre>
                ) : (
                    <p>No units available</p>
                )}
            </div>
        </div>
    );
}

export default CK_Debugger;