import React, { createContext, useContext, useState } from "react";
import { ThreadContext } from "./CK_Debugger";
import CreativeKernel from "../kernel/kernel";

function Unit ({ unit, id }: { unit: any, id: string }) {
    const [selectedUnit, setSelectedUnit] = useContext(UnitInspectorContext);
    const selected = selectedUnit === id;
    const setSelected = () => {
        setSelectedUnit(id);
    }
    const unitStyle = {
        border: selected ? "2px solid black" : "none",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        backgroundColor: unit.type === "install" ? "orange" : unit.type === "worker" ? "lightblue" : unit.type === "blocker" ? "gray" : "gray",
        cursor: "pointer",
    };
    return (
        <div style={unitStyle} onClick={setSelected}>
        </div>
    );
}

function Thread({ threadId }: { threadId: string }) {
    const threads = useContext(ThreadContext);
    const thread = threads[threadId];
    if (!thread) {
        return <div>Thread {threadId} not found</div>
    }
    return <div style={{
        height: "75px",
        border: "1px solid black",
        width: "100%",
        display: "flex",
    }}>
        <div style={{width: "150px"}}>
        {threadId}
        </div>
        <div style={{
            border: "1px solid black",
            width: "100%",
            display: "flex",
            alignItems: "center",
        }}>
            {thread.map((unit, index) => {
                return <Unit key={unit.id} id={unit.id} unit={unit} /> 
            })
            }
        </div>
    </div>
}

function Threads() {
    const threads = useContext(ThreadContext);
    const threadKeys = Object.keys(threads);
    return (
        <div style={{
            height: "100%",
            width: "100%",
        }}>
                {threadKeys.map((key) => {
                    return (
                        <Thread key={key} threadId={key} />
                    );
                })}
        </div>
    );
}

function UnitInspector() {
    const [selectedUnit, setSelectedUnit] = useContext(UnitInspectorContext);
    const threads = useContext(ThreadContext);
    const unit = Object.values(threads).flat().find((unit) => unit.id === selectedUnit);
    if (!unit) {
        return <div>Unit not found</div>
    }

    const kernel = (window as any).CREATIVE_KERNEL as CreativeKernel;
    const threadId = Object.keys(threads).find((key) => threads[key].find((u) => u.id === unit.id) != undefined);

    const installable = unit.type === "install";
    const computable = unit.type === "worker" && kernel.checkIfUnitReady(threadId, unit.id);

    const install = async () => {
        if (installable) {
            await kernel.installUnit(threadId, unit.id);
            setSelectedUnit(null);
        }
    }

    const compute = async () => {
        if (computable) {
            const result = kernel.computeUnit(threadId, unit.id);
        }
    }

    return (
        <div style={{
            height: "100%",
            overflow: "hidden",
            //wordBreak: "break-word",
        }}>
            {installable && <button onClick={install}>install</button>}
            {computable && <button onClick={compute}>compute</button>}
            <pre style={{
            }}>
            {JSON.stringify(unit, null, 2)}
            </pre>

        </div>
    );
}


const UnitInspectorContext = createContext(null);
function CK_ThreadsPage() {

    const [selectedUnit, setSelectedUnit] = useState(null);


    return (
        <UnitInspectorContext.Provider value={[selectedUnit, setSelectedUnit]}>
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            height: "100%",

        }}>
            <div style={{
                border: "1px solid black",

            }}>
                <Threads />
            </div>
            <div style={{
                border: "1px solid black",

            }}>
                <UnitInspector />
            </div>
        </div>
        </UnitInspectorContext.Provider>
    );
}
export default CK_ThreadsPage;