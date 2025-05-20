import { CK_InstallUnit, CK_Modality, CK_TerminateUnit, CK_WorkerUnit, CK_Workload } from "../kernel/types";
import CreativeKernel from "../kernel/CreativeKernel";


type Instance = {
    computeUnit: (unit: CK_WorkerUnit) => Promise<CK_Workload>;
}

type InstanceFactory = (instanceId: string, pushWorkload: (w: CK_Workload) => void) => Promise<{
    instance: Instance, metadata: { [key: string]: unknown }
}>;


class DefaultModality implements CK_Modality {
    instanceFactories: {
        [resourceId: string]: InstanceFactory;
    } = {};
    addInstanceFactory(resourceId: string, instanceFactory: InstanceFactory) {
        this.instanceFactories[resourceId] = instanceFactory;
    }

    kernel: CreativeKernel | null = null;
    connectToKernel(kernel: CreativeKernel) {
        this.kernel = kernel;
    }

    instances: {
        [instanceId: string]: Instance;
    } = {};
    async installUnit(unit: CK_InstallUnit) {
        const { instance_id, resource_id } = unit.instance;
        if (!this.instanceFactories[resource_id]) throw new Error(`No instance factory found for resource ID: ${resource_id}`);
        const instanceFactory = this.instanceFactories[resource_id];
        const pushWorkload = (w: CK_Workload) => {
            this.kernel?.pushWorkload(w);
        };
        const { instance, metadata } = await instanceFactory(instance_id, pushWorkload);
        this.instances[instance_id] = instance;
        return metadata;
    }
    async terminateUnit(unit: CK_TerminateUnit) {
        const { instance_id } = unit.instance;
        if (this.instances[instance_id]) {
            delete this.instances[instance_id];
            return true;
        } else {
            throw new Error(`Instance with ID ${instance_id} not found`);
        }
    }
    async computeUnit(unit: CK_WorkerUnit) {
        const { receiver } = unit;
        const { instance_id } = receiver;
        const instance = this.instances[instance_id];
        if (!instance) {
            throw new Error(`Instance ${instance_id} not found`);
        }
        return await instance.computeUnit(unit);
    }
}

export default DefaultModality;