import { produce } from "immer";
import {
    CK_Modality,
    CK_Unit,
    CK_WorkerUnit,
    CK_InstallUnit,
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
            const success = await modality.installUnit(unit);
            if (success) {
                this.registry = [...this.registry, unit.instance];
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
                        && receiver.resource_id !== unit.instance.resource_id
                        && receiver.modality !== unit.instance.modality;
                });
                this.notifySubscribers();
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

    public pushUnit(threadId: string, unit: CK_Unit) {
        this.threads = produce(this.threads, (draft) => {
            unit.id = generateId();
            if (!draft[threadId]) {
                draft[threadId] = [];
            }
            draft[threadId].push(unit);
        })
        this.notifySubscribers();
    }

    queuedReceivers: CK_Instance[] = [];
    public pushWorkload(workload: {
        [threadId: string]: CK_Unit[];
    }) {
        console.log("workload", workload);
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
                        throw new Error("install Queued by modality")
                    }
                    if (unit.type === "worker") {
                        // check if worker receiver in registry

                        const receiver = this.registry.find((item) => {
                            return item.instance_id === unit.receiver.instance_id
                                && item.resource_id === unit.receiver.resource_id
                                && item.modality === unit.receiver.modality;
                        });
                        if (!receiver) {
                            // check if receiver already queued
                            console.log("queuedReceivers", this.queuedReceivers);
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
                    throw new Error("Unknown unit type");
                });
                draft[key].push(...newThreadQueue);
            });
        })
        this.notifySubscribers();

    }

    public async computeUnit(threadId: string, unitId: string) {
        const ready = this.checkIfUnitReady(threadId, unitId);
        if (!ready) {
            throw new Error(`Unit ${unitId} in thread ${threadId} is not ready`);
        }
        const unitIdx = this.threads[threadId].findIndex((unit) => unit.id === unitId);
        const unit = this.threads[threadId][unitIdx] as CK_WorkerUnit;
        const modality = this.modalities[unit.receiver.modality];
        if (!modality) {
            throw new Error(`Modality ${unit.receiver.modality} not found`);
        }
        const threadQueues = await modality.computeUnit(unit);
        if (threadQueues === undefined) {
            throw new Error(`Error computing unit ${unitIdx} in thread ${threadId}`);
        }

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
                    if (unit.type === "blocker") {
                        newThreadQueue.push(unit);
                        return;
                    }
                    if (unit.type === "install") {
                        throw new Error("install Queued by modality")
                    }
                    if (unit.type === "worker") {
                        // check if worker receiver in registry
                        const receiver = this.registry.find((item) => {
                            return item.instance_id === unit.receiver.instance_id
                                && item.resource_id === unit.receiver.resource_id
                                && item.modality === unit.receiver.modality;
                        });
                        if (!receiver) {
                            // check if receiver already queued
                            console.log("queuedReceivers", this.queuedReceivers);

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
                    throw new Error("Unknown unit type");
                });
                draft[key].push(...newThreadQueue);
            });
            // remove the unit from the thread
            const unitIdx = draft[threadId].findIndex((unit) => unit.id === unitId);
            console.log("unitIdx", unitIdx);
            draft[threadId].splice(unitIdx, 1);
            // check if the thread is empty
            if (draft[threadId].length === 0) {
                delete draft[threadId];
            }
        })
        // resolve any blocker units
        this.resolveBlockerUnits();
        this.notifySubscribers();
    }

}

export default CreativeKernel;