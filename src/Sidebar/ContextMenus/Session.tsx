import React from "react";
import { SimpleCommittedTextInput, Button, Logo } from "@mtrifonov-design/pinsandcurves-design";

function SessionContextMenu(p: {}) {

    const [projectName, setProjectName] = React.useState<string>("Project");

    return <div style={{
        width: "300px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",

    }}>
        <div style={{
        width: "100%",
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
                //console.log(projectName)
                if (projectName) {
                    setProjectName(projectName);
                }
            }}
            iconName={"folder_open"}
        />
    </div>
    <div style={{
        color: "var(--gray6)",
    }}>
        <div style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "5px",
        }}>
            <Logo 
                style={{
                    width: "40px",
                    height: "40px",
                }}
                color={"var(--gray6)"}
            />
            Pins and Curves (Beta) 0.0.0
        </div>
        <br></br>
        Pins and Curves is a motion design tool
        that puts plugins first. <a href="https://pinsandcurves.app"
            style={{
                color: "var(--continuousBlue3)",
            }}
        >Learn more</a><br></br><br></br>
        <Button text="sign up to our mailing list" 
            onClick={() => {
                window.open("http://eepurl.com/i6WBsQ", "_blank");
            }}
            bgColor="var(--yellow3"
            color="var(--gray1)"
            hoverBgColor="var(--yellow2)"
            hoverColor="var(--gray1)"
            iconName={"mail"}
        />
    </div>
    </div>
}

export default SessionContextMenu;