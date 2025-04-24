import { Tree } from "./types";
import { defaultTree } from "./VertexOperations";


class TreeManager {
    private tree: Tree;
    private state: {tree: Tree, renderId: string};

    constructor() {
        this.tree = defaultTree()[0];
        this.state = {
            tree: this.tree,
            renderId: Math.random().toString(36).substring(2, 15)
        };
    }

    setTree(tree: Tree) {
        this.tree = tree;
        const renderId = Math.random().toString(36).substring(2, 15);
        this.state = {
            tree: this.tree, renderId
        }
        this.notifySubscribers();
    }
    getTree(): {tree: Tree, renderId: string} {
        return this.state;
    }

    subscribers : (() => void)[] = [];
    subscribe(callback: () => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter((cb) => cb !== callback);
        }
    }

    notifySubscribers() {
        this.subscribers.forEach((callback) => callback());
    }
}

export default TreeManager;