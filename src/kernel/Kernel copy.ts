import { CK_DebugConfig, CK_Message, CK_Registry, CK_Threads, CK_Unit, CK_InstanceIdentification } from "./types";


class CreativeKernel {
    constructor(modalities, debugConfig: CK_DebugConfig, snapshot?) {}
    
    debugConfig: CK_DebugConfig;
    setDebugConfig(debugConfig: CK_DebugConfig) {
        this.debugConfig = debugConfig;
    }

    registry: CK_Registry;
    getRegistry() {
        return this.registry;
    }

    threads: CK_Threads;
    getThreads() {
        return this.threads;
    }

    unitQueue: CK_Unit[];
    queueUnit(unit : CK_Unit) {
        this.unitQueue.push(unit);
        this.schedule();
    }

    findInstance(instanceId: CK_InstanceIdentification) {
        const { modality, resource_id } = instanceId;
        const instance = this.registry.find((instance) => {
            return instance.resource.modality === modality && instance.resource.resource_id === resource_id;
        });
        return instance;
    }

    deferredUnitQueue: CK_Unit[];
    processUnit(unit: CK_Unit) {
        // process the unit for computation
        // steps:

        // -. check if the message is valid

        // -. check if the specified thread exists.
        // if not, create the thread
        const threadId = unit.thread;
        if (!this.threads[threadId]) {
            this.threads[threadId] = {
                paused: false,
                queue: []
            };
        }

        // -. check if the thread is paused
        // if yes, add the unit to the deferred queue

        if (this[threadId].paused) {
            this.deferredUnitQueue.push(unit);
        }

        // -. check if the message complies with the sender outgoing api
        const sender = this.findInstance(unit.sender);
        if (!sender) { 
            throw new Error("Error processing unit. Sender not found."); 
        }
        const outgoing_api = sender.api.outgoing;
        const isValid = outgoing_api.some((api) => {
            matchObjectAgainstAPI(unit.payload, api);
        });
        if (!isValid) {
            this.debugConfig.logCallback({
                timestamp: Date.now(),
                type: "error",
                data: {
                    messageCode: "error_processing_unit",
                    message: "Error processing unit. Payload does not comply with the sender outgoing api.",
                    unit: unit,
                    sender: sender, 
                }
            });
        }

        // -. check if the receiver is in the registry
        // if not, attempt to create the instance, add the unit to the deferred queue and pause the thread
        const receiver = this.findInstance(unit.receiver);
        if (!receiver) {
            this.instantiate(unit.receiver);
            this.debugConfig.logCallback({
                timestamp: Date.now(),
                type: "info",
                data: {
                    messageCode: "instantiating_receiver",
                    message: "Receiver not found. Instantiating receiver.",
                    unit: unit,
                    receiver: unit.receiver,
                }
            });
            this.deferredUnitQueue.push(unit);
            this[threadId].paused = true;
            return;
        }

        // once the instance is created:
        // -. check if the message complies with the receiver incoming api
        const incoming_api = receiver.api.incoming;
        const isValidReceiver = incoming_api.some((api) => {
            matchObjectAgainstAPI(unit.payload, api);
        });
        if (!isValidReceiver) {
            this.debugConfig.logCallback({
                timestamp: Date.now(),
                type: "error",
                data: {
                    messageCode: "error_processing_unit",
                    message: "Error processing unit. Payload does not comply with the receiver incoming api.",
                    unit: unit,
                    receiver: receiver,
                }
            });
            return;
        }

        // -. add the unit to the thread queue 
        this.threads[threadId].queue.push(unit);
    }

    computeUnit(unit: CK_Unit) : boolean {
        // compute the unit
        const receiver = this.findInstance(unit.receiver);
        if (!receiver) {
            throw new Error("Error computing unit. Receiver not found.");
        }
        // process the unit
        receiver.computeUnit(unit);
        return true;

    }

    scheduled: boolean = false;
    async schedule() {
        if (this.scheduled) {
            return;
        }
        this.scheduled = true;
        this.run();
        this.scheduled = false;
    }


    running: boolean = false;
    run() {
        if (this.running) {
            return;
        }

        // process the message queue
        while (this.unitQueue.length > 0) {
            const message = this.unitQueue.shift();
            if (message) {
                // process the message
                this.processUnit(message);
            }
        }
        this.unitQueue = this.deferredUnitQueue;
        this.deferredUnitQueue = [];


        // determine which thread to run
        // pick the top unit from the queue
        const threadsArray = Object.values(this.threads)
        let threadsIdx = 0;

        while (this.running && threadsArray.flat().length > 0) {
            const threadQueue = threadsArray[threadsIdx].queue;
            if (threadQueue.length > 0) {
                const unit = threadQueue.shift();
                if (unit) {
                    this.running = this.computeUnit(unit);
                }
            }
            threadsIdx = (threadsIdx + 1) % threadsArray.length;
        }
    }
}