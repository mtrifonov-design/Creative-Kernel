import { CK_Modality,
    CK_Unit,
    CK_WorkerUnit,
    CK_InstallUnit,
    CK_BlockerUnit,
    CK_Instance,
    CK_Threads 
} from "./types";



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
        modalities: any;
        debugDevice: any;
        snapshot: any;
    }) {

        this.connectToDebugDevice(debugDevice);
        this.modalities = modalities;
        this.threads = {};
        this.restoreSnapshot(snapshot);
    }

    private connectToDebugDevice(debugDevice: any) {
        this.debugDevice = debugDevice;
        this.debugDevice.connectKernel()
    }

    private restoreSnapshot(snapshot: any) {
        if (snapshot) {
            this.threads = snapshot.threads;
        }
    }

    public getThreads() {
        return this.threads;
    }

    public checkIfUnitReady(threadId: string, unitIdx: number) {
        const thread = this.threads[threadId];
        if (!thread) {
            throw new Error(`Thread ${threadId} does not exist`);
        }
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

    public async installUnit(threadId: string, unitIdx: number) {
        const thread = this.threads[threadId];
        if (!thread) {
            throw new Error(`Thread ${threadId} does not exist`);
        }
        const unit = thread[unitIdx];
        if (!unit) {
            throw new Error(`Unit ${unitIdx} does not exist in thread ${threadId}`);
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
                // remove the unit from the thread
                this.threads[threadId].splice(unitIdx, 1);
                console.log(this.threads);
                // check if the thread is empty
                this.registry.push(unit.instance);
                if (this.threads[threadId].length === 0) {
                    delete this.threads[threadId];
                }
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

        threadKeys.forEach((threadId) => {
            const thread = this.threads[threadId];
            if (thread) {
                const unit = thread[0];
                if (unit && unit.type === "blocker") {
                    if (blockerIdsDelete.includes(unit.blocker_id)) {
                        this.threads[threadId].splice(0, 1);
                    }
                }
            }
        });
        // check if the thread is empty
        threadKeys.forEach((threadId) => {
            if (this.threads[threadId].length === 0) {
                delete this.threads[threadId];
            }
        });

        this.resolveBlockerUnits();
    }

    public pushUnit(threadId: string, unit: CK_Unit) {
        if (!this.threads[threadId]) {
            this.threads[threadId] = [];
        }
        this.threads[threadId].push(unit);
    }

    public computeUnit(threadId: string, unitIdx: number) {
        const ready = this.checkIfUnitReady(threadId, unitIdx);
        if (!ready) {
            throw new Error(`Unit ${unitIdx} in thread ${threadId} is not ready`);
        }
        const unit = this.threads[threadId][unitIdx] as CK_WorkerUnit;
        const modality = this.modalities[unit.receiver.modality];
        if (!modality) {
            throw new Error(`Modality ${unit.receiver.modality} not found`);
        }
        const threadQueues = modality.computeUnit(unit);
        if (!threadQueues) {
            throw new Error(`Error computing unit ${unitIdx} in thread ${threadId}`);
        }
        const threadKeys = Object.keys(threadQueues);
        threadKeys.forEach((key) => {
            const threadQueue = threadQueues[key];
            if (!this.threads[key]) {
                this.threads[key] = [];
            }
            // modify thread queue by queueing installs where needed
            const newThreadQueue: CK_Unit[] = [];
            threadQueue.forEach((unit: CK_Unit) => {
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
                        newThreadQueue.push({
                            type: "install",
                            instance: unit.receiver
                        })
                    }
                    newThreadQueue.push(unit);
                    return;
                }
                throw new Error("Unknown unit type");
            });
            this.threads[key].push(...newThreadQueue);
        });
        // remove the unit from the thread
        this.threads[threadId] = this.threads[threadId].splice(unitIdx, 1);
        // check if the thread is empty
        if (this.threads[threadId].length === 0) {
            delete this.threads[threadId];
        }
        // resolve any blocker units
        this.resolveBlockerUnits();
    }

}

export default CreativeKernel;