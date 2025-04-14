import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Instance, CK_Modality, CK_TerminateUnit, CK_Unit, CK_WorkerUnit } from "../kernel/types";
import TreeManager from "../PanelLib/TreeManager";
import { Tree } from "../PanelLib/types";

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

class UIModality implements CK_Modality {
    kernel: CreativeKernel | null = null;
    connectToKernel(kernel: CreativeKernel) {
        this.kernel = kernel;
    }

    treeManager: TreeManager;
    constructor() {
        this.treeManager = new TreeManager();
    }

    async installUnit(unit: CK_InstallUnit): Promise<false | {[key:string]: any}> {
        return {
            persistent: true,
        };
    }
    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {
        const { payload } = unit;
        const { tree, SAVE_SESSION, LOAD_SESSION, state, key } = payload;
        if (SAVE_SESSION) {
            return {
                persistence: [{
                    type: "worker",
                    sender: {
                        instance_id: "ui",
                        resource_id: "ui",
                        modality: "ui",
                    },
                    receiver: unit.sender,
                    payload: {
                        SAVE_SESSION: true,
                        key,
                        state: this.treeManager.getTree(),
                    },
                    id: generateId(),
                }],
            }
        } else if (LOAD_SESSION) {
            return this.constructSetTreeWorkload(state);
        } else {
            this.treeManager.setTree(tree);
            await this.render();
            const pendingWorkload = this.pendingWorkload;
            // console.log("pendingWorkload", pendingWorkload);
            this.pendingWorkload = [];
            return {
                ui: pendingWorkload,
            };
        }
    }

    rendered : (() => void) = () => {};
    async render() {
        return await new Promise((resolve) => {
            const callback = () => {resolve()}
            this.rendered = callback;
        });
    }


    async terminateUnit(unit: CK_TerminateUnit): Promise<boolean> {
        return true; 
    }



    pendingWorkload: CK_Unit[] = [];
    setIframe(id: string, address: string, iframe: HTMLIFrameElement) {
        globalThis.IFRAME_MODALITY.setIframe(id, address, iframe);
        const instanceExists = this.kernel?.getRegistry().find((instance: CK_Instance) => {
            return instance.instance_id === id && instance.resource_id === address && instance.modality === "iframe";
        })
        if (instanceExists) {
            this.pendingWorkload.push({
                type: "terminate",
                instance: {
                    modality: "iframe",
                    resource_id: address,
                    instance_id: id,
                },
                id: generateId(),
            })
        }
        this.pendingWorkload.push({
            type: "worker",
            sender: {
                instance_id: "ui",
                resource_id: "ui",
                modality: "ui",
            },
            receiver: {
                instance_id: id,
                resource_id: address,
                modality: "iframe",
            },
            payload: {
                INIT: true,
            },
            id: generateId(),
        })
    }



    constructDeps(tree: Tree) {
        const bNodes = Object.values(tree).filter((v) => v.type === "b");
        const bNodesWPayload = bNodes.filter((v) => v.payload !== undefined);
        const deps = bNodesWPayload.map((v) => {
            return {
                type: "worker",
                sender: {
                    instance_id: "UI",
                    resource_id: "UI",
                    modality: "ui",
                },
                receiver: {
                    modality: "iframe",
                    resource_id: v.payload.address,
                    instance_id: v.id,
                },
                payload: {
                    HELLO: true,
                },
                id: generateId(),
            }
        });
        return deps;
    }


    constructSetTreeWorkload(tree: Tree) {
        const deps = this.constructDeps(tree);
        const workload = {
            ui: [
                {
                type: "worker",
                sender: {
                    instance_id: "ui",
                    resource_id: "ui",
                    modality: "ui",
                },
                receiver: {
                    instance_id: "ui",
                    resource_id: "ui",
                    modality: "ui",
                },
                payload: {
                    tree,
                },
                id: generateId(),
            }]
        }
        return workload;
    }


    inProgress: boolean = false;
    async setTree(tree: Tree) {
        if (this.inProgress) {
            return;
        }
        this.inProgress = true;
        const workload = this.constructSetTreeWorkload(tree);
        ////console.log("deps", deps);
        ////console.log("UI Modality setTree", workload);
        await this.kernel?.pushWorkload(workload);
        this.inProgress = false;
    }

}

export default UIModality;