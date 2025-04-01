import { CK_Instance, CK_InstallUnit, CK_WorkerUnit, CK_Unit, CK_Modality } from "../kernel/types";

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

class MockModality implements CK_Modality {

    private resources: { [key: string]: any } = {};
    addResource(name: string, resource: any) : void {
        this.resources[name] = resource;
    }

    private instances: { [key: string]: any } = {};
    async installUnit(unit: CK_InstallUnit): Promise<boolean> {
        try {
            const resourceId = unit.instance.resource_id;
            const instanceId = unit.instance.instance_id;
            if (this.resources[resourceId]) {
                const instance = new this.resources[resourceId]();
                this.instances[instanceId] = instance;
                return true;
            } 
            return false;
        } catch (error) {
            return false;
        }
    }

    computeUnit(unit: CK_WorkerUnit): { [threadId: string]: CK_Unit[] } {
        try {
            const instance = this.instances[unit.receiver.instance_id];
            const result = instance.compute(unit);
            const keys = Object.keys(result);
            for (const key of keys) {
                const thread = result[key];
                for (const exported_unit of thread) {
                    exported_unit.sender = unit.receiver;
                }
            };

            return result;
        } catch (error) {
            return {};
        }
    }
}

export { MockModality };