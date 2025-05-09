import React from "react";
import { SimpleCommittedTextInput, Button } from "@mtrifonov-design/pinsandcurves-design";

function SessionContextMenu(p: {}) {

    const [projectName, setProjectName] = React.useState<string>("Project");

    return <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",

        gap: "10px",
        color: "var(--gray6)",
    }}>
        Save current session
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "5px",
            marginBottom: "10px",
        }}>
            <div style={{padding: "5px"}}>
            <SimpleCommittedTextInput
                onCommit={setProjectName}
                initialValue={projectName}
                key={projectName}
                bgColor={"var(--gray2)"}

            />
            </div>
            <Button
                text={"Download"}
                onClick={() => globalThis.PERSISTENCE_MODALITY.saveSession(projectName)}
                iconName={"save"}
            />
        </div>

        Load existing session
        <Button
            text={"Import"}
            onClick={async () => {
                const projectName = await globalThis.PERSISTENCE_MODALITY.loadSession()
                console.log(projectName)
                if (projectName) {
                    setProjectName(projectName);
                }
            }}
            iconName={"folder_open"}
        />
    </div>
}

export default SessionContextMenu;