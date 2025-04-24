import React, { createContext, useContext, useState } from "react";
import { ThreadContext } from "./CK_Debugger";
import CreativeKernel from "../kernel/kernel";
import CK_InstancesPage from "./CK_InstancesPage";

function Unit ({ unit, id }: { unit: any, id: string }) {
    const [selectedUnit, setSelectedUnit] = useContext(UnitInspectorContext);
    const selected = selectedUnit === id;
    const setSelected = () => {
        setSelectedUnit(id);
    }

    const threads = useContext(ThreadContext);
    const kernel = (window as any).CREATIVE_KERNEL as CreativeKernel;
    const threadId = Object.keys(threads).find((key) => threads[key].find((u) => u.id === unit.id) != undefined);

    const installable = unit.type === "install";
    const computable = unit.type === "worker" && kernel.checkIfUnitReady(threadId, unit.id);
    const terminatable = unit.type === "terminate";

    const doAction = async () => {
        if (installable) {
            await kernel.installUnit(threadId, unit.id);
            setSelectedUnit(null);
        }
        if (computable) {
            await kernel.computeUnit(threadId, unit.id);
        }
        if (terminatable) {
            await kernel.terminateUnit(threadId, unit.id);
            setSelectedUnit(null);
        }
    }

    const [hover, setHover] = useState(false);

    const unitStyle = {
        border: selected ? "2px solid black" : "none",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        backgroundColor: unit.type === "install" ? "orange" : unit.type === "worker" ? "lightblue" : unit.type === "blocker" ? "gray" : unit.type === "terminate" ? "red" : "gray",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    };
    return (
        <div style={unitStyle} onClick={setSelected}
            onMouseEnter={() => {setHover(true); setSelected()}}
            onMouseLeave={() => setHover(false)}
        >
            {(installable || computable || terminatable) && 
            <div style={{
                width: "50%",
                height: "50%",
                borderRadius: "50%",
                backgroundColor: hover ? "black" : "transparent",

            }}

            onClick={doAction}
            >
            </div>
            }
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
        width: "100%",
        overflowX: "scroll",
    }}>
    
    <div style={{
        height: "75px",
        border: "1px solid black",
        flexWrap: "nowrap",
        width: "max-content",
        display: "flex",
    }}>
        <div style={{width: "150px"}}>
        {threadId}
        </div>
        <div style={{
            border: "1px solid black",
            //width: "100%",
            display: "flex",
            
            flexWrap: "nowrap",
            width: "max-content",
            alignItems: "center",
        }}>
            {thread.map((unit, index) => {
                return <Unit key={unit.id} id={unit.id} unit={unit} /> 
            })
            }
        </div>
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
    return (
        <div style={{
            height: "100%",
            overflow: "hidden",
            padding: "5px",
            //wordBreak: "break-word",
        }}>


            {
                unit.type === "worker" && <div>
                    <div>Sender: {`${unit.sender.instance_id} [${unit.sender.modality}]`}</div>
                    <div>Receiver: {`${unit.receiver.instance_id} [${unit.receiver.modality}]`}</div>
                    <div>Payload: 
                        <pre style={{
                            backgroundColor: "#cccccc",
                            padding: "5px",
                        }}>
                        {JSON.stringify(unit.payload, null, 2)}
                        </pre>

                    </div>
                </div>
            }
            {
                unit.type === "install" && <div>
                    <div>Instance: {`${unit.instance.instance_id} [${unit.instance.modality}]`}</div>
                </div>
            }
            {
                unit.type === "terminate" && <div>
                    <div>Instance: {`${unit.instance.instance_id} [${unit.instance.modality}]`}</div>
                </div>
            }
                        {
                unit.type === "blocker" && <div>
                        <pre style={{
                            backgroundColor: "#cccccc",
                            padding: "5px",
                        }}>
                        {JSON.stringify(unit, null, 2)}
                        </pre>
                </div>
            }



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
            gridTemplateColumns: "1fr 300px 400px",
            width: "100vw",
            height: "100%",

        }}>
            <div style={{
                border: "1px solid black",
                overflow: "hidden",

            }}>
                <Threads />
            </div>
            <div style={{
                border: "1px solid black",

            }}>
                <UnitInspector />
            </div>
            <CK_InstancesPage />
        </div>
        </UnitInspectorContext.Provider>
    );
}
export default CK_ThreadsPage;