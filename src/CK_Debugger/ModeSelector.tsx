import React from "react";

interface ModeSelectorProps {
    mode: string;
    setMode: (mode: string) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode }) => {

    return (
        <div style={{ 
        display: "flex", 
        gap: "10px" 
        
        }}>
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
            <button
                onClick={() => setMode("SILENT")}
                style={{
                    padding: "5px 10px",
                    backgroundColor: mode === "SILENT" ? "#ddd" : "#fff",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                }}
            >
                SILENT
            </button>
        </div>
    );
};

export default ModeSelector;
