import React from "react";
import { CK_Unit } from "../kernel/types";

interface ThreadsRendererProps {
    threads: { [key: string]: CK_Unit[] };
    handleUnitHover: (unit: CK_Unit | null) => void;
}

const ThreadsRenderer: React.FC<ThreadsRendererProps> = ({ threads, handleUnitHover }) => {
    return (
        <>
            {Object.entries(threads).map(([threadName, units]) => (
                <div key={threadName} style={{ marginBottom: "10px",
                    width: "100%",
                    padding: "10px",
                 }}>
                    <label>{threadName}</label>
                    <div style={{ display: "flex", gap: "5px", width: "100%", border: "1px solid #ccc", padding: "5px" }}>
                        {units.map((unit, index) => (
                            <div
                                key={index}
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: unit.type === "worker" ? "lightblue" : unit.type === "install" ? "orange" : unit.type === "blocker" ? "black" : unit.type === "terminate" ? "red" : "gray",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() => handleUnitHover(unit)}
                                onMouseLeave={() => handleUnitHover(null)}
                            ></div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
};

export default ThreadsRenderer;
