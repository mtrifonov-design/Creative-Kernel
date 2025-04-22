import React, { useLayoutEffect, useEffect, useRef, useState } from "react";
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
        border: "1px solid rgb(180, 180, 180)",
        borderRadius: "5px",
    }}
        type="text" placeholder={address} ref={inputRef}
    />
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

    const address = payload !== undefined ? payload.address : undefined;
    const setAddress = (newAddress: string) => {
        setPayload({
            address: newAddress,
        });
    }
    const ref = useRef<HTMLDivElement>(null);
    const iframeIdRef = useRef<string>(generateId());

    useLayoutEffect(() => {
        if (!address) {
            return;
        }
        if (!ref.current) return;
        iframeIdRef.current = generateId();
        const iframeId = generateId();
        globalThis.UI_MODALITY.setIframe(id, iframeId,address,ref.current)
        return () => {
            globalThis.UI_MODALITY.terminateIframes(parentId);
        }
    }, [address]);

    const closeSelf = () => {
        globalThis.UI_MODALITY.terminateIframes(parentId);
        closePanel();
    }

    const splitRowCommand = () => {
        globalThis.UI_MODALITY.terminateIframes(parentId);
        splitRow();
    }
    const splitColumnCommand = () => {
        globalThis.UI_MODALITY.terminateIframes(parentId);
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
                backgroundColor: "rgb(230, 230, 230)",
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
                        }}
                        onClick={splitRowCommand}>|</button>
                    <button
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                        }}
                        onClick={splitColumnCommand}>—</button>
                    <button
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                        }}
                        onClick={closeSelf}>X</button>
                </div>
            </div>
            {address ?
                <iframe ref={ref}
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