import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Instance, CK_Modality, CK_TerminateUnit, CK_Unit, CK_WorkerUnit } from "../kernel/types";
import TreeManager from "../PanelLib/TreeManager";
import { Tree } from "../PanelLib/types";
import { findChild } from "../PanelLib/VertexOperations";

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

    computingUnit: boolean = false;
    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {
        this.computingUnit = true;
        const { payload } = unit;
        const { tree, SAVE_SESSION, LOAD_SESSION, state, key } = payload;
        if (SAVE_SESSION) {
            this.computingUnit = false;
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
            if (!state) return {};
            this.computingUnit = false;
            return this.constructSetTreeWorkload(state.tree);
        } else {
            // console.log("tree");
            this.treeManager.setTree(tree);
            await this.render();
            const pendingWorkload = this.pendingWorkload;
            this.pendingWorkload = [];
            this.computingUnit = false;
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



    liveIframes: { vertexId: string, id: string, address: string, iframe: HTMLIFrameElement }[] = [];

    pendingWorkload: CK_Unit[] = [];
    setIframe(vertexId: string, id: string, address: string, iframe: HTMLIFrameElement) {

        const existingIframe = this.liveIframes.find((v) => v.id === id && v.address === address);
        if (existingIframe) return;
        this.liveIframes.push({ vertexId, id, address, iframe });
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
        // console.log("setiframe",this.computingUnit)
        // //await this.render();
        if (!this.computingUnit) {
            this.kernel?.pushWorkload({
                ui: this.pendingWorkload,
            });
            this.pendingWorkload = [];
        }
    }

    terminateIframes(id?: string) {
        const markedForDeletion = []
        const { tree } = this.treeManager.getTree();
        let parentId;
        const v = tree[id];
        if (v && v.parentId) {
            parentId = v.parentId;
        } else {
            parentId = Object.values(tree).find((v) => v.root)?.id;
        }

        this.liveIframes.forEach(ifr => {
            // console.log("IM RUNNING SOMEHOW",ifr)
            const { vertexId, id, address, iframe } = ifr;
            const {tree} = this.treeManager.getTree();
            const child = findChild(tree, parentId, vertexId);
            const blocker_id = generateId();
            if (child) {
                markedForDeletion.push({id,address});
                this.pendingWorkload.push({
                    type: "worker",
                    sender: {
                        instance_id: "ui",
                        resource_id: "ui",
                        modality: "ui",
                    },
                    receiver: {
                        modality: "iframe",
                        resource_id: address,
                        instance_id: id,
                    },
                    payload: {
                        TERMINATE: true,
                        blocker_id,
                    },
                    id: generateId(),
                });
                this.pendingWorkload.push({
                    type: "blocker",
                    blocker_id,
                    blocker_count: 2,
                    id: generateId(),
                }) ;
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
        })
        this.liveIframes = this.liveIframes.filter((v) => {
            const { id, address } = v;
            const found = markedForDeletion.find((v) => v.id === id && v.address === address);
            return !found;
        });
        // const existingIframe = this.liveIframes.find((v) => v.id === id && v.address === address);
        // if (!existingIframe) return;

        // this.liveIframes = this.liveIframes.filter((v) => v.id !== id && v.address !== address);
        // const blocker_id = generateId();

        // this.pendingWorkload.push({
        //     type: "worker",
        //     sender: {
        //         instance_id: "ui",
        //         resource_id: "ui",
        //         modality: "ui",
        //     },
        //     receiver: {
        //         modality: "iframe",
        //         resource_id: address,
        //         instance_id: id,
        //     },
        //     payload: {
        //         TERMINATE: true,
        //         blocker_id,
        //     },
        //     id: generateId(),
        // });
        // this.pendingWorkload.push({
        //     type: "blocker",
        //     blocker_id,
        //     blocker_count: 2,
        //     id: generateId(),
        // })  
        // this.pendingWorkload.push({
        //     type: "terminate",
        //     instance: {
        //         modality: "iframe",
        //         resource_id: address,
        //         instance_id: id,
        //     },
        //     id: generateId(),
        // }) 
        // console.log("terminateIframe",this.computingUnit)
        // //await this.render();
        if (!this.computingUnit && this.pendingWorkload.length > 0) {
            this.kernel?.pushWorkload({
                ui: this.pendingWorkload,
            });
            this.pendingWorkload = [];
        }
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
    pendingTrees : any[] = [];
    async setTree(tree: Tree) {
        this.pendingTrees.push(tree);
        if (this.inProgress) {
            return;
        }
        this.inProgress = true;
        while (this.pendingTrees.length > 0) {
            const nextTree = this.pendingTrees[0];
            if (nextTree) {
                const workload = this.constructSetTreeWorkload(nextTree);
                await this.kernel?.pushWorkload(workload);
                this.pendingTrees.shift();
                /// console.log(this.pendingTrees.length);
            }
        }
        this.inProgress = false;
    }

}

export default UIModality;