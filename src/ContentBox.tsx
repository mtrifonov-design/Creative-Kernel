import React, { useEffect, useRef } from "react";
import { getIframe } from "./iframe_manager";


const ContentBox : React.FC<{id:string}> = ({id}) => {

    const [address, setAddress] = React.useState<string>('NONE');

    useEffect(() => {
        if (address === 'NONE') {
            return;
        }
        const iframe = getIframe(address);
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        
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
        display: 'flex',
        flexDirection: 'column',
    }}>
        <div>
            <input type="text" defaultValue={address} ref={inputRef} />
            <button onClick={() => {
                const newAddress = inputRef.current?.value;
                setAddress(newAddress || 'NONE');
            }}>Set Address</button>
        </div>

        <div style={{
            width: "100%",
            height: "100%",
        }} ref={ref}>Nothing here...</div>
    </div>
    

}


export default ContentBox;