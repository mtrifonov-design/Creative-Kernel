import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Modality, CK_TerminateUnit, CK_Unit, CK_WorkerUnit } from "../kernel/types";

class PrivilegedModality implements CK_Modality {
    kernel: CreativeKernel | null = null;
    connectToKernel(kernel: CreativeKernel) {
        this.kernel = kernel;
    }

    constructor() {
    }

    async installUnit(unit: CK_InstallUnit): Promise<false | { [key: string]: any }> {
        return {};
    }

    async terminateUnit(unit: CK_TerminateUnit): Promise<boolean> {
        return true;
    }

    session: CK_WorkerUnit[] = [];
    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {
        const { payload, sender, receiver } = unit;

        const instanceWorker = this.instanceWorkers[receiver.instance_id];
        if (instanceWorker) {
            return instanceWorker.computeUnit(unit);
        }

        return {};
    }

    instanceWorkers: { [key: string]: any } = {};
    appendInstance(instanceId: string, instanceWorker: any) {
        this.instanceWorkers[instanceId] = instanceWorker(this);
    }

    pushWorkload(workload: any) {
        this.kernel?.pushWorkload(workload);
    }

}

export default PrivilegedModality;