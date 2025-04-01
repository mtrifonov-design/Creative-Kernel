import CreativeKernel from "../kernel/Kernel";
import { MockModality } from "../modalities/MockModality";
import DebugDevice from "../debug_devices/DebugDevice";
import { CK_Unit } from "../kernel/types";


let modality;
let kernel;

beforeEach(() => {
    modality = new MockModality();
    kernel = new CreativeKernel({
        modalities: {
            mock: modality,
        },
        debugDevice: new DebugDevice(),
        snapshot: null,
    });
});

describe("Integration testing", () => {
    it("should create a kernel instance", () => {
        expect(kernel).toBeDefined();
    });

    /*
    ---
    empty
    ---
    ->
    ---
    test_thread: [*]
    ---
    */
    it("should be able to push a unit to the kernel", () => {
        const unit : CK_Unit = {
            type: "install",
            instance: {
                modality: "mock",
                resource_id: "test_resource",
                instance_id: "test_instance",
            },
        };
        const threadId = "test_thread";
        kernel.pushUnit(threadId,unit);
        expect(kernel.getThreads()).toHaveProperty("test_thread");
        expect(kernel.getThreads()[threadId]).toContainEqual(unit);
    });

});

