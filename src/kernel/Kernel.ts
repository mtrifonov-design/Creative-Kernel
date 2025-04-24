import { produce } from "immer";
import {
    CK_Modality,
    CK_Unit,
    CK_WorkerUnit,
    CK_InstallUnit,
    CK_TerminateUnit,
    CK_BlockerUnit,
    CK_Instance,
    CK_Threads
} from "./types";

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}


class CreativeKernel {
    private debugDevice: any;
    private modalities: {
        [key: string]: CK_Modality;
    };
    private threads: CK_Threads;
    private registry: CK_Instance[] = [];
    constructor({
        modalities,
        debugDevice,
        snapshot
    }: {
        modalities: {
            [key: string]: CK_Modality;
        };
        snapshot: any;
    }) {
        this.modalities = modalities;
        const modalityKeys = Object.keys(modalities);
        modalityKeys.forEach((key) => {
            const modality = modalities[key];
            modality.connectToKernel(this);
        });


        this.threads = {};
        this.restoreSnapshot(snapshot);
    }


    _running = false;
    setRunning(running: boolean) {
        this._running = running;
        this.notifySubscribers();
    };

    getRunning() {
        return this._running;
    }


    private restoreSnapshot(snapshot: any) {
        if (snapshot) {
            this.threads = snapshot.threads;
        }
    }

    private subscibers : Function[] = [];
    public subscribe(callback: () => void) {
        this.subscibers.push(callback);
        return () => {
            this.subscibers = this.subscibers.filter((cb) => cb !== callback);
        }
    }

    notifySubscribers() {
        this.subscibers.forEach((callback) => {
            callback();
        });
    }

    public getThreads() {
        return this.threads;
    }

    public getRegistry() {
        return this.registry;
    }

    public checkIfUnitReady(threadId: string, unitId: string) {
        const thread = this.threads[threadId];
        if (!thread) {
            throw new Error(`Thread ${threadId} does not exist`);
        }
        const unitIdx = thread.findIndex((unit) => unit.id === unitId);
        const unit = thread[unitIdx];
        if (!unit) {
            throw new Error(`Unit ${unitIdx} does not exist in thread ${threadId}`);
        }
        const unitType = unit.type;
        if (unitType === "worker" && unitIdx === 0) {
            return true;
        }
        return false;
    }

    public async installUnit(threadId: string, unitId: string) {
        
        const thread = this.threads[threadId];
        if (!thread) {
            throw new Error(`Thread ${threadId} does not exist`);
        }
        const unitIdx = thread.findIndex((unit) => unit.id === unitId);
        const unit = thread[unitIdx];
        // console.log(unit);
        if (!unit) {
            throw new Error(`Unit ${unitId} does not exist in thread ${threadId}`);
        }
        const unitType = unit.type;
        if (unitType === "install") {
            // install the unit
            const modality = this.modalities[unit.instance.modality];
            if (!modality) {
                throw new Error(`Modality ${unit.instance.modality} not found`);
            }
            const metadata = await modality.installUnit(unit);
            if (metadata !== false) {
                const enrichedInstance = {
                    ...unit.instance,
                    metadata,
                }
                this.registry = [...this.registry, enrichedInstance];
                this.threads = produce(this.threads, (draft) => {
                    // remove the unit from the thread
                    const unitIdx = draft[threadId].findIndex((unit) => unit.id === unitId);
                    draft[threadId].splice(unitIdx, 1);
                    // check if the thread is empty
                    if (draft[threadId].length === 0) {
                        delete draft[threadId];
                    }



                });
                this.queuedReceivers = this.queuedReceivers.filter((receiver) => {
                    return receiver.instance_id !== unit.instance.instance_id
                        || receiver.resource_id !== unit.instance.resource_id
                        || receiver.modality !== unit.instance.modality;
                });
                this.incrementalChange();
                return;
            }
            throw new Error(`Error installing unit ${unitIdx} in thread ${threadId}`);
        }
        throw new Error(`Unit ${unitIdx} is not a install unit`);

    }

    private resolveBlockerUnits() {
        const threadKeys = Object.keys(this.threads);
        const blockers = threadKeys.map((key) => {
            const thread = this.threads[key];
            if (thread) {
                return thread[0];
            }
            return null;
        }).filter((value) => value !== null)
            .filter((value) => {
                if (value && value.type === "blocker") {
                    return true;
                }
                return false;
            }) as CK_BlockerUnit[];

        const blockerByIds = {};
        blockers.forEach((blocker) => {
            if (!blockerByIds[blocker.blocker_id]) {
                blockerByIds[blocker.blocker_id] = [];
            }
            blockerByIds[blocker.blocker_id].push(blocker);
        });

        const blockerByIdsForDeletion = {};
        Object.keys(blockerByIds).forEach((key) => {
            const blockers = blockerByIds[key];
            if (blockers.length === blockers[0].blocker_count) {
                blockerByIdsForDeletion[key] = true;
            }
        });

        const blockerIdsDelete = Object.keys(blockerByIdsForDeletion);
        if (blockerIdsDelete.length === 0) {
            return;
        }

        this.threads = produce(this.threads, (draft) => {

            threadKeys.forEach((threadId) => {
                const thread = draft[threadId];
                if (thread) {
                    const unit = thread[0];
                    if (unit && unit.type === "blocker") {
                        if (blockerIdsDelete.includes(unit.blocker_id)) {
                            draft[threadId].splice(0, 1);
                        }
                    }
                }
            });
            // check if the thread is empty
            threadKeys.forEach((threadId) => {
                if (draft[threadId].length === 0) {
                    delete draft[threadId];
                }
            });
        });
        this.resolveBlockerUnits();
    }

    workloadProcessing = false;
    pendingWorkloads : { [threadId: string]: CK_Unit[] }[] = [];

    queuedReceivers: CK_Instance[] = [];
    public async pushWorkload(workload: {
        [threadId: string]: CK_Unit[];
    }) {
        //console.log(workload)
        if (Object.keys(workload).length === 0) return;
        if (this.workloadProcessing) {
            //console.log("Workload processing, pushing workload to queue");
            this.pendingWorkloads.push(workload);
            return;
        };
        this.workloadProcessing = true;
        this.threads = produce(this.threads, (draft) => {
            const threadKeys = Object.keys(workload);
            const threadQueues = workload;
            threadKeys.forEach((key) => {
                const threadQueue = threadQueues[key];
                if (!draft[key]) {
                    draft[key] = [];
                }
                // modify thread queue by queueing installs where needed
                const newThreadQueue: CK_Unit[] = [];
                threadQueue.forEach((unit: CK_Unit) => {
                    unit.id = generateId();
                    if (unit.type === "blocker") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "install") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "worker") {
                        // check if worker receiver in registry
                        const receiver = this.registry.find((item) => {
                            return item.instance_id === unit.receiver.instance_id
                                && item.resource_id === unit.receiver.resource_id
                                && item.modality === unit.receiver.modality;
                        });
                        if (!receiver) {
                            const queuedReceiver = this.queuedReceivers.find((item) => {
                                return item.instance_id === unit.receiver.instance_id
                                    && item.resource_id === unit.receiver.resource_id
                                    && item.modality === unit.receiver.modality;
                            });
                            if (!queuedReceiver) {
                                this.queuedReceivers.push(unit.receiver);
                                newThreadQueue.push({
                                    type: "install",
                                    instance: unit.receiver,
                                    id: generateId(),
                                })
                            }
                        }
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "terminate") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    throw new Error("Unknown unit type");
                });
                draft[key].push(...newThreadQueue);
            });
        })
        ////console.log("workload", this.threads);
        await this.run();
        let mergedWorkload = {};
        while (this.pendingWorkloads.length > 0) {
            //console.log(this.pendingWorkloads.length)
            const nextWorkload = this.pendingWorkloads[0];
            if (nextWorkload) {
                const mergedWorkloadKeys = Object.keys(mergedWorkload);
                for (const key in nextWorkload) {
                    if (mergedWorkloadKeys.includes(key)) {
                        mergedWorkload[key].push(...nextWorkload[key]);
                    } else {
                        mergedWorkload[key] = nextWorkload[key];
                    }
                }
            }
            this.pendingWorkloads.shift();
        }
        this.workloadProcessing = false;
        await this.pushWorkload(mergedWorkload);
        this.notifySubscribers();
    }

    public async terminateUnit(threadId: string, unitId: string) {
        const thread = this.threads[threadId];
        if (!thread) {
            throw new Error(`Thread ${threadId} does not exist`);
        }
        const unitIdx = thread.findIndex((unit) => unit.id === unitId);
        const unit = thread[unitIdx];
        if (!unit) {
            throw new Error(`Unit ${unitId} does not exist in thread ${threadId}`);
        }
        const unitType = unit.type;
        if (unitType === "terminate") {
            // install the unit
            const modality = this.modalities[unit.instance.modality];
            if (!modality) {
                throw new Error(`Modality ${unit.instance.modality} not found`);
            }
            const success = await modality.terminateUnit(unit);
            if (success === true) {
                this.threads = produce(this.threads, (draft) => {
                    // remove the unit from the thread
                    const unitIdx = draft[threadId].findIndex((unit) => unit.id === unitId);
                    draft[threadId].splice(unitIdx, 1);
                    // check if the thread is empty
                    if (draft[threadId].length === 0) {
                        delete draft[threadId];
                    }
                });
                // console.log(this.registry,unit)
                const filteredRegistry = this.registry.filter((item) => {
                    return item.instance_id !== unit.instance.instance_id
                        || item.resource_id !== unit.instance.resource_id
                        || item.modality !== unit.instance.modality;});
                this.registry = filteredRegistry;
                this.removeUnreachableUnits(unit.instance);
                //this.addInstallUnits();
                this.incrementalChange();
                return;
            }
            throw new Error(`Error terminating unit ${unitIdx} in thread ${threadId}`);
        }
        throw new Error(`Unit ${unitIdx} is not a terminate unit`);
    }

    removeUnreachableUnits(instance) {
        this.threads = produce(this.threads, (draft) => {
            const threadKeys = Object.keys(draft);
            const threadQueues = draft;
            threadKeys.forEach((key) => {
                const threadQueue = threadQueues[key];
                // modify thread queue by queueing installs where needed
                const newThreadQueue: CK_Unit[] = [];
                threadQueue.forEach((unit: CK_Unit) => {
                    if (unit.type === "blocker") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "install") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "worker") {
                        // check if worker receiver in registry
                        const meantForInstance = unit.receiver.instance_id === instance.instance_id
                            && unit.receiver.resource_id === instance.resource_id
                            && unit.receiver.modality === instance.modality;
                        if (!meantForInstance) {
                            newThreadQueue.push(unit);
                            return;
                        }
                    }
                    if (unit.type === "terminate") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    throw new Error("Unknown unit type");
                });
                draft[key] = newThreadQueue;

                if (draft[key].length === 0) {
                    delete draft[key];
                }
            });
        })

    }

    addInstallUnits() {
        // console.log(this.queuedReceivers)
        this.threads = produce(this.threads, (draft) => {
            const threadKeys = Object.keys(draft);
            const threadQueues = draft;
            threadKeys.forEach((key) => {
                const threadQueue = threadQueues[key];
                // modify thread queue by queueing installs where needed
                const newThreadQueue: CK_Unit[] = [];
                threadQueue.forEach((unit: CK_Unit) => {
                    if (unit.type === "blocker") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "install") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "worker") {
                        // check if worker receiver in registry
                        const receiver = this.registry.find((item) => {
                            return item.instance_id === unit.receiver.instance_id
                                && item.resource_id === unit.receiver.resource_id
                                && item.modality === unit.receiver.modality;
                        });
                        // console.log(receiver)
                        if (!receiver) {
                            const queuedReceiver = this.queuedReceivers.find((item) => {
                                return item.instance_id === unit.receiver.instance_id
                                    && item.resource_id === unit.receiver.resource_id
                                    && item.modality === unit.receiver.modality;
                            });
                            if (!queuedReceiver) {
                                this.queuedReceivers.push({...unit.receiver});
                                newThreadQueue.push({
                                    type: "install",
                                    instance: unit.receiver,
                                    id: generateId(),
                                })
                            }
                        }
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "terminate") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    throw new Error("Unknown unit type");
                });
                draft[key] = newThreadQueue;
            });
        })

    }

    incrementalChange() {
        if (this._running) return;
        this.notifySubscribers();
    }


    public async computeUnit(threadId: string, unitId: string) {
        const ready = this.checkIfUnitReady(threadId, unitId);
        if (!ready) {
            throw new Error(`Unit ${unitId} in thread ${threadId} is not ready`);
        }
        const unitIdx = this.threads[threadId].findIndex((unit) => unit.id === unitId);
        const unit = this.threads[threadId][unitIdx] as CK_WorkerUnit;
        // console.log(unit)
        const modality = this.modalities[unit.receiver.modality];
        if (!modality) {
            throw new Error(`Modality ${unit.receiver.modality} not found`);
        }
        const threadQueues = await modality.computeUnit(unit);
        if (threadQueues === undefined) {
            throw new Error(`Error computing unit ${unitIdx} in thread ${threadId}`);
        }
        //console.log("threadQueues", threadQueues);

        this.threads = produce(this.threads, (draft) => {
            const threadKeys = Object.keys(threadQueues);
            threadKeys.forEach((key) => {
                const threadQueue = threadQueues[key];
                if (!draft[key]) {
                    draft[key] = [];
                }
                // modify thread queue by queueing installs where needed
                const newThreadQueue: CK_Unit[] = [];
                threadQueue.forEach((unit: CK_Unit) => {
                    unit.id = generateId();
                    //console.log("unit", unit);
                    if (unit.type === "blocker") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "install") {
                        throw new Error("install Queued by modality")
                    }
                    if (unit.type === "worker") {
                        const receiver = this.registry.find((item) => {
                            return item.instance_id === unit.receiver.instance_id
                                && item.resource_id === unit.receiver.resource_id
                                && item.modality === unit.receiver.modality;
                        });
                        if (!receiver) {
                            const queuedReceiver = this.queuedReceivers.find((item) => {
                                return item.instance_id === unit.receiver.instance_id
                                    && item.resource_id === unit.receiver.resource_id
                                    && item.modality === unit.receiver.modality;
                            });
                            if (!queuedReceiver) {
                                //console.log("queueing receiver", unit.receiver.instance_id);
                                this.queuedReceivers.push({...unit.receiver});
                                newThreadQueue.push({
                                    type: "install",
                                    instance: unit.receiver,
                                    id: generateId(),
                                })
                            }
                        }
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "terminate") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    throw new Error("Unknown unit type");
                });
                
                draft[key].push(...newThreadQueue);
            });
            // remove the unit from the thread
            const unitIdx = draft[threadId].findIndex((unit) => unit.id === unitId);
            //////console.log("unitIdx", unitIdx);
            draft[threadId].splice(unitIdx, 1);
            // check if the thread is empty
            if (draft[threadId].length === 0) {
                delete draft[threadId];
            }
        })
        // resolve any blocker units
        this.resolveBlockerUnits();
        this.incrementalChange();
    }


    index = 0;
    public async run() {
        if (!this._running) {
            return;
        }
        //(this.threads)
        const firstUnits = Object.keys(this.threads).map((key) => {
            const thread = this.threads[key];
            if (thread) {
                return [key,thread[0]];
            }
            return null;
        }).filter((value) => value !== null) as [threadId: string, unit: CK_Unit][];
        ///console.log("firstUnits", firstUnits);
        const eligibleUnits = firstUnits.filter(([threadId,unit]) => {
            // console.log(unit);
            if (unit.type === "install") return true;
            if (unit.type === "blocker") return false;
            if (unit.type === "terminate") return true;
            return this.checkIfUnitReady(threadId, unit.id);
        })
        
        if (eligibleUnits.length === 0) {
            return;
        }
        const [threadId, unit] = eligibleUnits[this.index++ % eligibleUnits.length];
        const unitId = unit.id;
        const unitType = unit.type;
        if (unitType === "worker") {
            await this.computeUnit(threadId, unitId);
        }
        if (unitType === "install") {
            await this.installUnit(threadId, unitId);
        }
        if (unitType === "terminate") {
            await this.terminateUnit(threadId, unitId);
        }
        return await this.run();

    }

}

export default CreativeKernel;