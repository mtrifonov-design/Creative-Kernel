import { produce } from "immer";
import { Tree, VertexB, VertexC } from "./types";

const LEFT = "leftId";
const RIGHT = "rightId";

let DEBUG = false;

function setDebug() {
    DEBUG = true;
}

function appendVertexB(tree: Tree,inhabited: boolean): [Tree, string] {
    const id = generateId();
    return [produce(tree, (draft) => {
        const v : VertexB = {
            type: "b",
            id,
            inhabited,
            root: false,
        };
        draft[v.id] = v;
    }), id];
}

function appendVertexC(tree: Tree, leftId: string, rightId: string, direction: string): [Tree, string] {
    const id = generateId();
    return [produce(tree, (draft) => {
        const v : VertexC = {
            type: "c",
            id,
            children: {
                leftId,
                rightId,
            },
            percentage: 0.5,
            direction,
            root: false,
        };
        draft[v.id] = v;
        draft[leftId].parentId = v.id;
        draft[rightId].parentId = v.id;
    }), id];
}


function overwriteVertex(tree: Tree, vertexId: string, newVertexId: string): Tree {
    return produce(tree, (draft) => {
        const v = draft[vertexId] as VertexB | VertexC;
        const newVertex = draft[newVertexId] as VertexB | VertexC;
        // Reparenting
        if (v.parentId !== undefined) {
            const parent = draft[v.parentId];
            if (parent.type !== "c") {
                throw new Error("Parent is not of the right type");
            }
            let self;
            if (parent.children.leftId === vertexId) {
                self = LEFT;
            } else if (parent.children.rightId === vertexId) {
                self = RIGHT;
            } else {
                throw new Error("Vertex is not a child of the parent");
            }
            if (self === LEFT) {
                parent.children.leftId = newVertex.id;

            } else if (self === RIGHT) {
                parent.children.rightId = newVertex.id;
            } 

            newVertex.parentId = parent.id;
        } else {

            newVertex.root = true;
            newVertex.parentId = undefined;
        }


        delete draft[vertexId];
    });
};

function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

function split(tree: Tree, vertexId: string, direction: string): Tree {
    const v = tree[vertexId];
    if (v.type !== "b") {
        throw new Error("Vertex is not of the right type");
    }
    if (v.inhabited) {
        throw new Error("Vertex is already inhabited");
    }

    const [t1,l] = appendVertexB(tree, false);
    tree = t1;
    const [t2,r] = appendVertexB(tree, false);
    tree = t2;
    const [t3,c] = appendVertexC(tree, l, r, direction);
    tree = t3;
    tree = overwriteVertex(tree, vertexId, c);

    if (DEBUG) {
        ////console.log("create", tree);
    }

    return tree;
}

function setPercentage(tree: Tree, vertexId: string, percentage: number): Tree {
    const v = tree[vertexId];
    if (v.type !== "c") {
        throw new Error("Vertex is not of the right type");
    }
    if (percentage < 0 || percentage > 1) {
        throw new Error("Percentage is out of bounds");
    }
    tree = produce(tree, (draft) => {
        (draft[vertexId] as VertexC).percentage = percentage;
    });
    if (DEBUG) {
        ////console.log("setPercentage", tree);
    }
    return tree;
}

function close(tree: Tree, vertexId: string): Tree {
    const v = tree[vertexId];
    if (v.type !== "b") {
        throw new Error("Vertex is not of the right type");
    }
    if (!v.parentId) {
        throw new Error("Vertex has no parent");
    }
    const parent = tree[v.parentId];
    if (parent.type !== "c") {
        throw new Error("Parent is not of the right type");
    }
    let survivingSilbling;
    if (parent.children.leftId === vertexId) {
        survivingSilbling = parent.children.rightId;
    } else if (parent.children.rightId === vertexId) {
        survivingSilbling = parent.children.leftId;
    } else {
        throw new Error("Vertex is not a child of the parent");
    }

    tree = produce(tree, (draft) => {
        delete draft[vertexId];
    });

    tree = overwriteVertex(tree, v.parentId, survivingSilbling);

    if (DEBUG) {
        ////console.log("close", tree);
    }
    return tree;
}


function defaultTree(): [Tree, string] {
    let [tree, id] = appendVertexB({}, false);
    tree = produce(tree, (draft) => {
       (draft[id] as VertexB).root = true;
    });
    return [tree, id];
}




export { split, close, defaultTree, setDebug, setPercentage }