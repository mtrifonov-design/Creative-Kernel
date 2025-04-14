import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Modality, CK_TerminateUnit, CK_Unit, CK_WorkerUnit } from "../kernel/types";


function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

class PersistenceModality implements CK_Modality {
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

    session : CK_WorkerUnit[] = [];
    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {
        const { payload, sender } = unit;
        const { SAVE_SESSION, key, state } = payload;
        if (SAVE_SESSION) {
            this.keys = this.keys.filter((k) => k !== key);
            this.session.push({
                type: "worker",
                sender: {
                    instance_id: "persistence",
                    resource_id: "persistence",
                    modality: "persistence",
                },
                receiver: sender,
                payload: {
                    LOAD_SESSION: true,
                    state,
                },
                id: generateId(),
            })
            if (this.keys.length === 0) {
                // download the session
                const blob = new Blob([JSON.stringify(this.session)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "session.json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.session = [];
            }
        }
        return {};
    }

    keys: string[] = [];
    async saveSession() {
        this.session = [];
        const registry = this.kernel?.getRegistry();
        if (!registry) {
            return;
        }
        const persistentInstances = registry.filter(
            (instance) => instance.metadata? instance.metadata.persistent : false
        )

        await this.kernel?.pushWorkload({
            persistence: persistentInstances.map((instance) => {
                const key = generateId();
                this.keys.push(key);
                return {
                    type: "worker",
                    sender: {
                        instance_id: "persistence",
                        resource_id: "persistence",
                        modality: "persistence",
                    },
                    receiver: {
                        instance_id: instance.instance_id,
                        resource_id: instance.resource_id,
                        modality: instance.modality,
                    },
                    payload: {
                        SAVE_SESSION: true,
                        key,
                    }
                }
            })
        });
    }

    async loadSession() {
        // upload session as file
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target?.result as string;
                const session = JSON.parse(text);
                await this.kernel?.pushWorkload({
                    persistence: session
                });
                this.session = [];
                this.keys = [];
            }
            reader.readAsText(file);
        }
        input.click();
    }
}

export default PersistenceModality;