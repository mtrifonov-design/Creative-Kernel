import { Button, Icon } from "@mtrifonov-design/pinsandcurves-design";
import React from "react";
import SessionContextMenu from "./ContextMenus/Session";
import ToolContextMenu from "./ContextMenus/Tools";
import AssetContextMenu from "./ContextMenus/Assets";

enum ContextMenu {
    None = "none",
    Session = "session",
    Assets = "assets",
    Tools = "tools",
}


function Badge(p: {
    text: string;
    selected?: boolean;
    onSelect: () => void;
}) {
    const [hover, setHover] = React.useState(false);
    return <div className="materialSymbols"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={p.onSelect}
        style={{
            width: "60px",
            height: "60px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "30px",
            color: hover || p.selected ? "var(--gray1)" : "var(--gray6)",
            backgroundColor: hover ? "var(--yellow1)" : p.selected ? "var(--yellow2)" : "var(--gray2)",
            borderRadius: "var(--borderRadiusSmall",
            cursor: "pointer",
            userSelect: "none",
        }}
    >
        {p.text}
    </div>
}

function PermanentSidebar(p: {
    contextMenu: ContextMenu;
    setContextMenu: (contextMenu: ContextMenu) => void;
}) {

    const toggleContextMenu = (menu: ContextMenu) => () => {
        if (p.contextMenu === menu) {
            p.setContextMenu(ContextMenu.None);
        } else {
            p.setContextMenu(menu);
        }
    }

    const { contextMenu, setContextMenu } = p;
    return (
        <div style={{
            width: "auto",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "10px",
            gap: "10px",

        }}>
        <Badge text="draft" selected={contextMenu === ContextMenu.Session} 
        onSelect={toggleContextMenu(ContextMenu.Session)}/>
        <Badge text="folder_open" selected={contextMenu === ContextMenu.Assets} 
        onSelect={toggleContextMenu(ContextMenu.Assets)} />
        <Badge text="extension" selected={contextMenu === ContextMenu.Tools} 
        onSelect={toggleContextMenu(ContextMenu.Tools)}/>
        </div>
    );
}

function ContextMenuPanel(p: {
    contextMenu: ContextMenu;
}) {
    const {contextMenu} = p
    return (
        <div style={{
            width: "auto",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: "15px",
            paddingRight: "30px",
            boxSizing: "border-box",
            gap: "10px",

        }}>
            <div style={{
                color: "var(--gray7)",
                fontSize: "24px",
            }}>{contextMenu}</div>
            {p.contextMenu === ContextMenu.Session && <SessionContextMenu />}
            {p.contextMenu === ContextMenu.Assets && <AssetContextMenu />}
            {p.contextMenu === ContextMenu.Tools && <ToolContextMenu />}
        </div>
    );
}

function Sidebar() {

    const [contextMenu, setContextMenu] = React.useState<ContextMenu>(ContextMenu.None);

    return (
        <div style={{
            width: "100%",
            height: "100%",
            padding: "2px",
            paddingRight: "4px",
            boxSizing: "border-box",
        }}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                border: "2px solid var(--gray4)",
                borderRadius: "var(--borderRadiusSmall)",
                width: "100%",
                height: "100%",
                padding: "3px",
                boxSizing: "border-box",
            }}>
            <PermanentSidebar contextMenu={contextMenu} setContextMenu={setContextMenu}/>
            {contextMenu === ContextMenu.None ? null : <ContextMenuPanel contextMenu={contextMenu} />}
            </div>
        </div>
    );
}

export default Sidebar;