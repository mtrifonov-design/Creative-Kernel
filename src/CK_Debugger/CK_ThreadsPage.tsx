interface Unit {
    id: string;
    type: string;
    [key: string]: unknown;
}

interface ThreadsProps {
    threads: { [key: string]: Unit[] };
}

function CK_ThreadsPage({ threads }: ThreadsProps) {
    return (
        <div style={{ border: "1px solid black", padding: "10px" }}>
            <h3>Threads</h3>
            {Object.keys(threads).map((threadId) => (
                <div key={threadId} style={{ marginBottom: "10px" }}>
                    <h4>Thread {threadId}</h4>
                    <ul>
                        {threads[threadId].map((unit) => (
                            <li key={unit.id}>{JSON.stringify(unit)}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default CK_ThreadsPage;