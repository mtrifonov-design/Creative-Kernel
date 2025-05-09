import React, { useLayoutEffect, useSyncExternalStore } from "react";
import { SimpleCommittedTextInput, Button } from "@mtrifonov-design/pinsandcurves-design";


function AssetTypeIcon(p: {
    type: string;
}) {
    const { type } = p;
    const getIconName = (type: string) => {
        if (type === "timeline") return "animation";
        if (type === "html") return "html";
        if (type === "css") return "style";
        if (type === "js") return "javascript";
        return "extension";
    }
    const iconName = getIconName(type);


    return <div 
        className="materialSymbols"
    style={{
        width: "30px",
        height: "30px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "20px",
    }}>
        {iconName}
    </div>
}

function Asset(p: {
    assetId: string;
    assetMetadata: {
        name: string;
        type: string;
        preferredEditorAddress?: string;
    }
}) {
    const { assetId, assetMetadata } = p;
    const { name, type, preferredEditorAddress } = assetMetadata
    return <div style={{
        width: "250px",
        height: "40px",
        borderRadius: "var(--borderRadiusSmall)",
        backgroundColor: preferredEditorAddress ? "var(--gray2)" : "var(--gray1)",
        cursor: preferredEditorAddress ? "grabbing" : "pointer",
        padding: "5px",
        paddingLeft: "10px",
        paddingRight: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    }}
        draggable={preferredEditorAddress ? true : false}
        onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData("application/json", JSON.stringify({
                assetId: assetId,
                address: preferredEditorAddress,
            }));
        }}
    >
        {name}
        <AssetTypeIcon type={type} />
        </div> 
}


function AssetContextMenu(p: {}) {

    const assetViewer = globalThis.ASSET_VIEWER;

    const index = useSyncExternalStore(assetViewer.subscribe.bind(assetViewer), assetViewer.getSnapshot.bind(assetViewer));

    console.log("AssetContextMenu", index);

    useLayoutEffect(() => {
        assetViewer.connect();
        return () => {
            assetViewer.disconnect();
        }
    }, []);

    if (!index) {
        return <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "30px",
            color: "var(--gray6)",
        }}>
            Loading...
        </div>
    }




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
        {Object.entries(index).map(([assetId, assetMetadata]) => {
            return <Asset key={assetId} assetId={assetId} assetMetadata={assetMetadata} />
        })}

        

    </div>
}

export default AssetContextMenu;