import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Modality, CK_Unit, CK_WorkerUnit } from "../kernel/types";
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
            this.treeManager.setTree(state);
            return {};
        } else {
            this.treeManager.setTree(tree);
            return {};
        }

    }

    inProgress: boolean = false;
    async setTree(tree: Tree) {
        if (this.inProgress) {
            return;
        }
        this.inProgress = true;
        await this.kernel?.pushWorkload({
            ui: [{
                type: "worker",
                sender: {
                    instance_id: "UI",
                    resource_id: "UI",
                    modality: "ui",
                },
                receiver: {
                    instance_id: "UI",
                    resource_id: "UI",
                    modality: "ui",
                },
                payload: {
                    tree,
                },
                id: generateId(),
            }]
        });
        this.inProgress = false;
    }

}

export default UIModality;