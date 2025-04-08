import CreativeKernel from "../../kernel/kernel";
import { CK_Threads } from "../../kernel/types";
import { CK_Instance } from "../kernel/types";
import { MockModality } from "../../modalities/MockModality";
import DebugDevice from "../../debug_devices/DebugDevice";
import { renderThreads } from "./debugView";
import { ResourceA } from "./resources";

const modality = new MockModality();
const debugDevice = new DebugDevice();
const kernel = new CreativeKernel({
    modalities: {
        mock: modality,
    },
    debugDevice: debugDevice,
    snapshot: null,
});


const unit : CK_Unit = {
    type: "install",
    instance: {
        modality: "mock",
        resource_id: "resourceA",
        instance_id: "test_instance",
    },
};
modality.addResource("resourceA", ResourceA);
//console.log("Im here")

const threadId = "test_thread";
kernel.pushUnit(threadId,unit);

renderThreads( kernel);