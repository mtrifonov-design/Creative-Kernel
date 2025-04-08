import React, { createContext, useContext, useState } from "react";
import { RegistryContext, ThreadContext } from "./CK_Debugger";
import CreativeKernel from "../kernel/kernel";
import { CK_Instance } from "../kernel/types";


function Instance({ instance }: { instance: CK_Instance }) {

    const instance_id = instance.instance_id;
    const modality = instance.modality;

    return <div style={{
        marginBottom: "5px",
        border: "1px solid black",
        padding: "5px",
    }}>
        <div>{instance_id}</div>
        <div>{modality}</div>
    </div>
}

function CK_InstancesPage() {
    const instances = useContext(RegistryContext);
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            border: "1px solid black",
            padding: "5px",
        }}>
            Instances
                {
                    instances.map((instance: any, index: number) => {
                        return <Instance key={index} instance={instance} />
                    })
                }
        </div>
    );
}


export default CK_InstancesPage;