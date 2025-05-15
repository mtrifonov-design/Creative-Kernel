import React from "react";
import { CK_Instance, CK_Unit } from "../kernel/types";


const Instances: React.FC<{instances:CK_Instance[]}> = ({instances}) => {
    return (
        <div
            style={{
                width: "300px",
                height: "100%",
                overflow: 'scroll',
                marginLeft: "20px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#f9f9f9",
            }}
        >
            <h2>Instances</h2>
            {JSON.stringify(instances, null, 2)}
        </div>
    );
};

export default Instances;
