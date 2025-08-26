import CreativeKernel from "../kernel/KernelOBSOLETE";
import { CK_InstallUnit, CK_Modality, CK_TerminateUnit, CK_Unit, CK_WorkerUnit } from "../kernel/types";
import { TEMPLATES } from "../Persistence_Templates";

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

class PersistenceModality implements CK_Modality {
    kernel: CreativeKernel | null = null;
    connectToKernel(kernel: CreativeKernel) {
        this.kernel = kernel;
        this.kernel.registerInstalledInstance({ modality: "persistence", resource_id: "persistence", instance_id: "persistence" }, {});
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
                a.download = `${this.projectName}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.session = [];
            }
        }
        return {};
    }

    projectName: string = "default";
    keys: string[] = [];
    async saveSession(projectName: string) {
        this.projectName = projectName;
        this.session = [];
        const registry = this.kernel?.getRegistry();
        console.log(registry)
        if (!registry) {
            return;
        }
        const persistentInstances = registry.filter(
            (instance) => instance.metadata ? instance.metadata.persistent : false
        )

        this.kernel?.pushWorkload({
            persistence: persistentInstances.map((instance) => {
                const key = generateId();
                console.log("key", key)
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

        // clear url parameters
        const url = new URL(window.location.href);
        url.searchParams.delete("template");
        window.history.replaceState({}, document.title, url.toString());
    }

    async loadSessionFromTemplate(template: string) {
        const session = JSON.parse(TEMPLATES[template]);
        await this.kernel?.terminateAllInstances();
        await this.kernel?.pushWorkload({
            persistence: session
        });
        this.session = [];
        this.keys = [];

    }

    async loadSession() {
        // upload session as file
        const input = document.createElement("input");
        await new Promise((resolve) => {
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
                    const registry = this.kernel?.getRegistry();
                    if (!registry) {
                        return;
                    }
                    const persistentInstances = registry.filter(
                        (instance) => instance.metadata ? instance.metadata.persistent : false
                    )
                    await this.kernel?.terminateAllInstances();
                    await this.kernel?.pushWorkload({
                        persistence: session
                    });
                    this.session = [];
                    this.keys = [];
                    resolve();
                }
                reader.readAsText(file);
            }
            input.click();
        });
        let fileName = input.files?.[0]?.name;
        // remove .json
        fileName = fileName?.replace(".json", "");
        return fileName;
    }
}

export default PersistenceModality;