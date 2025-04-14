import React, { useLayoutEffect, useEffect, useRef } from "react";
import { CK_Unit } from "../kernel/types";
// import { getIframe } from "../iframe_manager";

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

const SearchBar: React.FC<{
    setAddress: (address: string) => void,
}> = ({ setAddress }) => {
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
        type="text" placeholder="Search" ref={inputRef} 
    />
}

const ContentComponent: React.FC<{
    id: string,
    splitRow: () => void,
    splitColumn: () => void,
    closePanel: () => void,
    payload: any,
    setPayload: (newPayload: any) => void,
}> = ({ id, splitColumn, splitRow, closePanel, payload, setPayload }) => {

    const address = payload !== undefined ? payload.address : undefined;
    const setAddress = (newAddress: string) => {
        setPayload({
            address: newAddress,
        });
    }

    useLayoutEffect(() => {
        if (!address) {
            return;
        }
        if (!ref.current) return;

        globalThis.UI_MODALITY.setIframe(id,address,ref.current)


        // ////console.log("effect",address)
        // const callback = (iframe: HTMLIFrameElement) => {
        //     ////console.log("callback", iframe)
        //     iframe.style.width = '100%';
        //     iframe.style.height = '100%';
        //     iframe.style.border = 'none';
        //     iframe.style.display = 'block';
        //     if (ref) {
        //         ref.current.innerHTML = '';
        //         ref.current.appendChild(iframe);
        //     }
        // }
        // const iframeModality = globalThis.IFRAME_MODALITY;
        // setTimeout(() => {
        //     iframeModality.getIframe(id,address, callback);
        // },0)
        return () => {
            // delete the iframe.
        }
    }, [address]);


    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    return <div style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateRows: "25px 1fr",
        padding: "2px",
        boxSizing: "border-box",
        overflow: "hidden",
    }}>
        <div style={{
            backgroundColor: "rgb(230, 230, 230)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopLeftRadius: "5px",
            borderTopRightRadius: "5px",
            padding: "5px",
            gap: "5px",
        }}>
            
            <SearchBar setAddress={setAddress} />
            
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
                    onClick={splitRow}>|</button>
                <button
                    style={{
                        width: "18px",
                        height: "18px",
                        fontSize: "8px",
                    }}
                    onClick={splitColumn}>—</button>
                <button
                    style={{
                        width: "18px",
                        height: "18px",
                        fontSize: "8px",
                    }}
                    onClick={closePanel}>X</button>
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
        > </iframe>
        : <div>Nothing to see.</div>}
    </div>


}



export default ContentComponent;