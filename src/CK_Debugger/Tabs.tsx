import React from "react";

interface TabsProps {
    pending: { [key: string]: any }[];
    view: string | number;
    setView: (view: string | number) => void;
}

const Tabs: React.FC<TabsProps> = ({ pending, view, setView }) => {
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

    return <div style={{ display: "flex", gap: "10px" }}>{tabs}</div>;
};

export default Tabs;
