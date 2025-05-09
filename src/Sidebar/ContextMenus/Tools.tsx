import React, { useDeferredValue, useEffect } from "react";
import { SimpleCommittedTextInput, Button, Icon } from "@mtrifonov-design/pinsandcurves-design";
import { CorePluginBase } from "../../Config";


function Tool(p: {
    label: string;
    icon: string;
    address: string;
}) {
    const { label, icon, address } = p;
    const [hover, setHover] = React.useState(false);

    return <div style={{
        display: "flex",

        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        backgroundColor: "var(--gray2)",
        borderRadius: "var(--borderRadiusSmall)",
        padding: "15px",
        paddingLeft: "15px",
        paddingRight: "15px",
        cursor: "grab",
        color: "var(--gray7)",
        width: "170px",
        height: "80px",
    }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        draggable={true}
        onDragStart={(e) => {
            console.log("dragstart", label);
            e.dataTransfer?.setData("application/json", JSON.stringify({
                address: address,
            }));
        }}
    >
        <div>{label}</div>
        <div className="materialSymbols"
            style={{
                fontSize: "24px",
            }}
        >
            {icon}
        </div>
    </div>

}

function ToolContextMenu(p: {}) {
    const base = CorePluginBase;

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


        <Tool label={"Timeline"} icon={"animation"} address={base+"editing"} />
        <Tool label={"Signals"} icon={"animation"} address={base+"signals"} />
        <Tool label={"Code Editor"} icon={"code"} address={base+"code"} />
        <Tool label={"HTML Preview"} icon={"html"} address={base+"htmlpreview"} />
        
    </div>
}

export default ToolContextMenu;