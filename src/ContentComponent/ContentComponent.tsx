import React, { useEffect, useRef } from "react";
import { getIframe } from "../iframe_manager";


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
}> = ({ id, splitColumn, splitRow, closePanel }) => {

    const [address, setAddress] = React.useState<string | undefined>(undefined);

    useEffect(() => {
        const iframe = getIframe(id,address);
        console.log(id,iframe);
        if (!iframe) {
            return;
        }
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        if (ref) {
            ref.current.innerHTML = '';
            ref.current.appendChild(iframe);
        }
        return () => {

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
        <div ref={ref}>
            Nothing to see here...
        </div>

    </div>


}

{/* <div style={{
        width: "100%",
        height: "100%",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    }}>
        <div>
            <input type="text" placeholder={address} ref={inputRef} />
            <button onClick={() => {
                const newAddress = inputRef.current?.value;
                setAddress(newAddress || 'NONE');
            }}>Set Address</button>
        </div>
    </div> */}

{/* <div style={{
    width: "100%",
    height: "100%",
    display: "grid",
    gridTemplateRows: "23px 1fr",


    
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
    }}>
        <div></div>
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
            onClick={() => {
                const newTree = split(tree, id, "row");
                setTree(newTree);
            }}>|</button>
            <button 
                style={{
                    width: "18px",
                    height: "18px",
                    fontSize: "8px",
                }}
            onClick={() => {
                const newTree = split(tree, id, "column");
                setTree(newTree);
            }}>—</button>
            <button 
                style={{
                    width: "18px",
                    height: "18px",
                    fontSize: "8px",
                }}
            onClick={() => {
                const newTree = close(tree, id);
                setTree(newTree);
            }}>X</button>
        </div>
    </div>
    <div>            
        <ContentComponent id={id} />
    </div>

</div> */}


export default ContentComponent;