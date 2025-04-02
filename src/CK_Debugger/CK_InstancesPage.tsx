import React, { createContext, useContext, useState } from "react";
import { RegistryContext, ThreadContext } from "./CK_Debugger";
import CreativeKernel from "../kernel/kernel";
import { CK_Instance } from "../kernel/types";


function Instance({ instance }: { instance: CK_Instance }) {

    return <div>
        {JSON.stringify(instance, null, 2)}
    </div>
}

function CK_InstancesPage() {
    const instances = useContext(RegistryContext);
    return (
        <div style={{
            display: "flex",
            height: "100%",
            width: "100%",
        }}>
                {
                    instances.map((instance: any, index: number) => {
                        return <Instance key={index} instance={instance} />
                    })
                }
        </div>
    );
}


export default CK_InstancesPage;