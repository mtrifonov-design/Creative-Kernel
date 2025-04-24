import React, { useLayoutEffect, useEffect, useRef, useState, useCallback } from "react";
import { CK_Unit } from "../kernel/types";
// import { getIframe } from "../iframe_manager";
import PlaceholderBox from "./PlaceholderBox";

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

const SearchBar: React.FC<{
    setAddress: (address: string) => void,
    address: string,
}> = ({ setAddress, address }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const newAddress = inputRef.current?.value;
                setAddress(newAddress || 'NONE');
            }
        };
        const handle = inputRef.current;
        if (handle) {
            handle.addEventListener('keydown', listener);
        }
        return () => {
            if (handle) {
                handle.removeEventListener('keydown', listener);
            }
        }
    }, [setAddress]);

    return <input style={{
        width: "100%",
        backgroundColor: "transparent",
        border: "1px solid #3B434B",
        borderRadius: "5px",
        color: "#C6D6E6"
    }}
        type="text" placeholder={address} ref={inputRef}
    />
}

function useIframeChannel(nodeId: string, address?: string) {
    const frameRef = useRef<HTMLIFrameElement>(null);
    const connected = useRef(false);
    const iframeId = useRef<string>();
  
    useLayoutEffect(() => {
      if (!address || !frameRef.current) return;
  
      // first (real) mount ➜ open
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
        console.log("closeWithAck", subtreeRootId,connected.current);
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

    payload = payload !== undefined ? payload : {
        id: generateId(),
        address: undefined,
    }

    //const unloaded = useRef(false);
    const address = payload !== undefined ? payload.address : undefined;
    const setAddress = (newAddress: string) => {
        setPayload({
            address: newAddress,
        });
    }
    // const ref = useRef<HTMLDivElement>(null);
    // const iframeIdRef = useRef<string>(generateId());
    // useLayoutEffect(() => {
    //     if (!address) {
    //         return;
    //     }
    //     if (!ref.current) return;
    //     iframeIdRef.current = generateId();
    //     const iframeId = generateId();
    //     globalThis.UI_MODALITY.setIframe(id, iframeId,address,ref.current)
    //     return () => {
    //         // if (!unloaded.current) {
    //         globalThis.UI_MODALITY.terminateIframes(id);
    //         // }
    //     }
    // }, [address]);

    const { frameRef, closeWithAck } = useIframeChannel(id, address);


    const closeSelf = async () => {
        const { tree } = globalThis.UI_MODALITY.treeManager.getTree();
        let parentId;
        const v = tree[id];
        // console.log(v);
        // console.log(JSON.stringify(tree,null,2))
        if (v) {
            if (v.parentId) {
                parentId = v.parentId;
            } else {
                parentId = v.id;
            }
        }
        await closeWithAck(parentId);
        // globalThis.UI_MODALITY.terminateIframes(parentId);
        //unloaded.current = true;
        closePanel();
    }

    const splitRowCommand = async () => {
        await closeWithAck(id);
        
        //globalThis.UI_MODALITY.terminateIframes(id);
        //unloaded.current = true;
        splitRow();
    }
    const splitColumnCommand = async () => {
        await closeWithAck(id);
        // globalThis.UI_MODALITY.terminateIframes(id);
        //unloaded.current = true;
        splitColumn();
    }

    const inputRef = useRef<HTMLInputElement>(null);
    return <div style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "2px",
    }}>
        <div style={{
            borderRadius: "8px",
            overflow: "hidden",
            display: "grid",
            gridTemplateRows: "25px 1fr",
            width: "100%",
            height: "100%",
        }}>
            <div style={{
                backgroundColor: "#1D2126",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px",
                gap: "5px",
            }}>

                <SearchBar setAddress={setAddress} address={address} key={address} />

                <div style={{
                    display: "flex",
                    gap: "2px",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    
                }}>
                    <button
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                            backgroundColor: "#59646E",
                            color:"#C6D6E6"
                        }}
                        onClick={splitRowCommand}>|</button>
                    <button
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                            backgroundColor: "#59646E",
                            color: "#C6D6E6"
                        }}
                        onClick={splitColumnCommand}>—</button>
                    <button
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                            backgroundColor: "#59646E",
                            color: "#C6D6E6"
                        }}
                        onClick={closeSelf}>X</button>
                </div>
            </div>
            {address ?
                <iframe ref={frameRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                    }}
                    key={address}
                > </iframe>
                : <PlaceholderBox setAddress={setAddress} />
            }
        </div>
    </div>
}



export default ContentComponent;