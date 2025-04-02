import React from 'react';
import { TreeComponent } from './PanelLib/VertexComponents';
import './App.css';
import CK_Debugger from './CK_Debugger/CK_Debugger';

import CreativeKernel from "./kernel/kernel";
import { CK_Threads } from "./kernel/types";
import { CK_Instance } from "./kernel/types";
import { MockModality } from "./modalities/MockModality";
import { ResourceA } from "./integration_testing/browser/resources";


const modality = new MockModality();
const kernel = new CreativeKernel({
    modalities: {
        mock: modality,
    },
    snapshot: null,
});


const unit: CK_Unit = {
    type: "install",
    instance: {
        modality: "mock",
        resource_id: "resourceA",
        instance_id: "test_instance",
    },
};
modality.addResource("resourceA", ResourceA);
const threadId = "test_thread";
kernel.pushUnit(threadId, unit);

globalThis.CREATIVE_KERNEL = kernel;


const App: React.FC = () => {
    return <div style={{
        height: "100vh",
        width: "100vw",
        display: "grid",
        gridTemplateRows: "2fr 1fr",
    }}>
            <TreeComponent />
            <CK_Debugger />
    </div>
}
export default App;

