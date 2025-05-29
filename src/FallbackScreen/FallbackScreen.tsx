import { Button, Logo } from "@mtrifonov-design/pinsandcurves-design";
import React from "react";


function FallbackScreen({
    h1Text,
    pText,
    buttonText,
    onButtonClick,
}:any) {
    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            height: "100vh", 
            width: "100vw",
            backgroundColor: "var(--gray2)", 
            color: "var(--gray6)",
            padding: "40px"
        }}>
            <Logo style={{
                width: "150px",
                height: "150px",
                marginBottom: "20px"
            }} />
            <h1 style={{
                textAlign: "center",
                fontWeight: "normal"
            }}>{h1Text}</h1>
            <p>{pText}</p>
            <br></br>
            <Button
                onClick={onButtonClick}
                text={buttonText} />
        </div>
    );
}

export default FallbackScreen;