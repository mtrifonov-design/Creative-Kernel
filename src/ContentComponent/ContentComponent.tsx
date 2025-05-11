import React, { useLayoutEffect, useEffect, useRef, useState, useCallback } from "react";
import { CK_Unit } from "../kernel/types";
// import { getIframe } from "../iframe_manager";
import PlaceholderBox from "./PlaceholderBox";
import { Icon, Logo } from "@mtrifonov-design/pinsandcurves-design";
import { useDraggingAssetContext } from "../App";


function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

function useIframeChannel(nodeId: string, address?: string) {
    const frameRef = useRef<HTMLIFrameElement>(null);
    const connected = useRef(false);
    const iframeId = useRef<string>();
  
    useLayoutEffect(() => {
      if (!address || !frameRef.current) return;
  
      // first (real) mount ➜ open
      //console.log("useIframeChannel", address, iframeId.current);
      if (!connected.current) {
        iframeId.current = generateId();
        UI_MODALITY.setIframe(nodeId, iframeId.current, address, frameRef.current);
        connected.current = true;
      }
      return () => {
      };
    }, [address]);
  
    /** Close with ACK and return only when peer confirms. */
    const closeWithAck = useCallback(async (subtreeRootId: string) => {
        //console.log("closeWithAck", subtreeRootId,connected.current);
      //if (!connected.current) return;
      await UI_MODALITY.terminateIframes(subtreeRootId);
      connected.current = false;
    }, []);
  
    return { frameRef, closeWithAck };
  }
  

const ContentComponent: React.FC<{
    id: string,
    parentId?: string,
    splitRow: () => void,
    splitColumn: () => void,
    closePanel: () => void,
    payload: any,
    setPayload: (newPayload: any) => void,
}> = ({ parentId, id, splitColumn, splitRow, closePanel, payload, setPayload }) => {


    const initialized = payload && (payload.address !== undefined);
    const [dropPossible, setDropPossible] = useState(false);
    const [draggingAsset, setDraggingAsset] = useDraggingAssetContext();
    //console.log("draggingAsset", draggingAsset);

    const assetName = payload && payload.assetMetadata ? payload.assetMetadata.name : undefined;

    payload = payload !== undefined ? payload : {
        id: generateId(),
        address: undefined,
    }

    const address = payload !== undefined ? payload.address : undefined;
    const setAddress = (newAddress: string, assetMetadata? : any) => {
        setPayload({
            address: newAddress,
            assetMetadata,
        });
    }

    const { frameRef, closeWithAck } = useIframeChannel(id, address);



    const closeSelf = async () => {
        const { tree } = globalThis.UI_MODALITY.treeManager.getTree();
        let parentId;
        const v = tree[id];
        if (v) {
            if (v.parentId) {
                parentId = v.parentId;
            } else {
                parentId = v.id;
            }
        }
        await closeWithAck(parentId);
        closePanel();
    }

    const splitRowCommand = async () => {
        await closeWithAck(id);
        splitRow();
    }
    const splitColumnCommand = async () => {
        await closeWithAck(id);
        splitColumn();
    }

    const inputRef = useRef<HTMLInputElement>(null);
    return <div style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "2px",
        borderRadius: "var(--borderRadiusSmall)",
        position: "relative",

    }}
        onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDropPossible(true);
        }}
        onDragLeave={(e) => {
            setDropPossible(false);
        }}
        
        onDrop={async (e) => {
            //if (initialized) return;
            setDraggingAsset(false);
            setDropPossible(false);
            e.preventDefault();
            e.stopPropagation();
            const data = e.dataTransfer.getData("application/json");
            const parsedData = JSON.parse(data);
            const { address, assetMetadata } = parsedData;
            if (address) {
                await closeWithAck(id);
                setDropPossible(false);
                setAddress(address, assetMetadata);
            }
        }}

    >
        <div style={{
            position: "absolute",
            backgroundColor: "var(--gray1)",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            zIndex: 0,
        }}>
            <Logo style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                
                width: "200px",
                height: "200px",

            }} 
            color ={"var(--gray3)"}
            />
        </div>
        <div style={{
            borderRadius: "var(--borderRadiusSmall)",
            overflow: "hidden",
            display: "grid",
            gridTemplateRows: "35px 1fr",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            border: dropPossible ? "2px solid var(--yellow2)" : "2px solid var(--gray2)"
        }}>
            <div style={{
                backgroundColor: "var(--gray2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "5px",
                gap: "5px",

            }}>
                <div style={{
                    color: "var(--gray6)",
                    marginLeft: "5px",
                }}>
                    {assetName ? assetName : ""}
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                }}>

                <div style={{
                    display: "flex",
                    gap: "2px",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    
                }}>


                    <Icon iconName={"border_vertical"}
                        style={{margin:"0px"}}
                        onClick={splitRowCommand}
                    />
                    <Icon iconName={"border_horizontal"}
                        style={{margin:"0px"}}
                        onClick={splitColumnCommand}
                    />
                    <Icon iconName={"close"}
                        style={{margin:"0px"}}
                        onClick={closeSelf}
                    />
                </div>
                </div>
            </div>
            {address ?
                <iframe ref={frameRef}
                    style={{
                        width: "100%",
                        height: "calc(100% - 35px)",
                        border: "none",
                        position: "absolute",
                        top: "35px",
                        left: 0,
                        pointerEvents: draggingAsset ? "none" : "inherit",

                    }}
                    key={address}
                > </iframe>
                : <PlaceholderBox setAddress={setAddress} />
            }
        </div>
        
    </div>
}



export default ContentComponent;