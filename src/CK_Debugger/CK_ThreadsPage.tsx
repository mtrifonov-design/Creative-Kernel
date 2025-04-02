import React, { useContext } from "react";
import { ThreadContext } from "./CK_Debugger";

function Thread({ threadId }: { threadId: string }) {
    const threads = useContext(ThreadContext);
    const thread = threads[threadId];
    if (!thread) {
        return <div>Thread {threadId} not found</div>
    }
    return <div>
        {threadId}
    </div>
}

function Threads() {
    const threads = useContext(ThreadContext);
    const threadKeys = Object.keys(threads);
    return (
        <div style={{
            display: "flex",
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

function CK_ThreadsPage() {
    return (
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

            }}>UNIT INSPECTOR</div>
        </div>
    );
}
export default CK_ThreadsPage;