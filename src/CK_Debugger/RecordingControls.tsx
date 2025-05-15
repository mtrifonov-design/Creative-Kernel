import React from "react";
import RecordingSideEffect from "../kernel/sideEffects/RecordingSideEffect";


const RecordingControls: React.FC = () => {


    const [isRecording,setIsRecording] = React.useState(false);

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
                window.CREATIVE_KERNEL.pushRecordingToPending();
            };
            reader.readAsText(file);
        }
    };

    return (
        <div style={{ 
            display: "flex", 
            gap: "10px", 
            alignItems: "center",
            border: "1px solid #ccc",
            padding: "5px", 

        }}>
            <button onClick={handleToggleRecording} style={{ 
                marginRight: "10px",
                padding: "5px 10px",

            }}>
                {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            <button onClick={handleSaveRecording} style={{ 
                marginRight: "10px",
                padding: "5px 10px",    
            }}>
                Save Recording to JSON
            </button>
            <label style={{ marginRight: "10px",
                padding: "5px 10px",
                backgroundColor: "#f0f0f0",
                cursor: "pointer",

             }}>
                Load Recording from JSON
                <input type="file" accept=".json" onChange={handleLoadRecording} style={{ display: "none" }} />
            </label>
        </div>
    );
};

export default RecordingControls;
