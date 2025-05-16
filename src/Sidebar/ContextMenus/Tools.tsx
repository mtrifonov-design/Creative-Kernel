import React, { useDeferredValue, useEffect } from "react";
import { SimpleCommittedTextInput, Button, Icon } from "@mtrifonov-design/pinsandcurves-design";
import { CorePluginBase } from "../../Config";
import { useDraggingAssetContext } from "../../App";


function Tool(p: {
    label: string;
    icon: string;
    address: string;
}) {
    const { label, icon, address } = p;
    const [hover, setHover] = React.useState(false);
    const [dragging, setDragging] = useDraggingAssetContext();

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
            //console.log("dragstart", label);
            setDragging(true);
            e.dataTransfer?.setData("application/json", JSON.stringify({
                address: address,
            }));
        }}
        onDragEnd={(e) => {
            setDragging(false);
            e.stopPropagation();
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
        <Tool label={"Cyber Spaghetti Viewer"} icon={"dinner_dining"} address={base+"cyberspaghetti"} />
        <Tool label={"Cyber Spaghetti Controls"} icon={"dinner_dining"} address={base+"cyberspaghetti-controlconsole"} />
        <Tool label={"Liquid Lissajous Viewer"} icon={"dinner_dining"} address={base+"liquidlissajous"} />
        <Tool label={"Liquid Lissajous Controls"} icon={"dinner_dining"} address={base+"liquidlissajous-controlconsole"} />
        
    </div>
}

export default ToolContextMenu;