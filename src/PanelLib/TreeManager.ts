import { Tree } from "./types";
import { defaultTree } from "./VertexOperations";


class TreeManager {
    private tree: Tree;

    constructor() {
        this.tree = defaultTree()[0];
    }

    setTree(tree: Tree) {
        this.tree = tree;
        this.notifySubscribers();
    }
    getTree(): Tree {
        return this.tree;
    }

    subscribers : Function[] = [];
    subscribe(callback: Function) {
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