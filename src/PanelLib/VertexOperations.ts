import { produce } from "immer";
import { Tree, VertexB,Vertex, VertexC } from "./types";

const LEFT = "leftId";
const RIGHT = "rightId";

let DEBUG = false;

function setDebug() {
    DEBUG = true;
}

function findChild(tree: Tree, startingVertexId?: string, searchingVertexId: string) : boolean {
    try {
        let startingVertex;
        if (startingVertexId !== undefined) {
            startingVertex = tree[startingVertexId] as Vertex;
        } else {
            startingVertex = Object.values(tree).find((v) => v.root);
        }

        if (startingVertex.type === "b") {
            return startingVertex.id === searchingVertexId;
        } else if (startingVertex.type === "c") {
            const left = findChild(tree,startingVertex.children.leftId, searchingVertexId);
            const right = findChild(tree,startingVertex.children.rightId, searchingVertexId);
            return left || right;
        }
        return false;
    } catch (e) {
        console.error("Error in findChild", e);
        console.error("Tree", tree);
        console.error("Starting vertex id", startingVertexId);
        console.error("Searching vertex id", searchingVertexId);
        return false;
    }
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
            if (v.root) {
                for (const node of Object.values(draft)) node.root = false;
                newVertex.root = true;
            }            
            newVertex.parentId = undefined;
        }


        delete draft[vertexId];
    });
};

function generateId(): string {
    return crypto.randomUUID();
}

function split(tree: Tree, vertexId: string, direction: string): Tree {
    const v = {...tree[vertexId]};
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
    tree = produce(tree, (draft) => {
        (draft[l] as VertexB).payload = v.payload;
    })

    if (DEBUG) {
        assertTreeIntegrity(tree);
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
        assertTreeIntegrity(tree);
    }
    return tree;
}

function setPayload(tree: Tree, vertexId: string, payload: any): Tree {
    const v = tree[vertexId];
    if (v.type !== "b") {
        throw new Error("Vertex is not of the right type");
    }
    tree = produce(tree, (draft) => {
        (draft[vertexId] as VertexB).payload = payload;
        const newId = crypto.randomUUID();
        const newVertex = draft[vertexId] as VertexB;
        newVertex.id = newId;
        if (newVertex.parentId) {
            const parent = draft[newVertex.parentId];
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
                parent.children.leftId = newId;

            } else if (self === RIGHT) {
                parent.children.rightId = newId;
            } 
        }
        delete draft[vertexId];
        draft[newId] = newVertex;
    });
    if (DEBUG) {
        assertTreeIntegrity(tree);
    }
    return tree;
}

function close(tree: Tree, vertexId: string): Tree {
    // //console.log(JSON.stringify(tree,null,2))
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
    let survivingSilblingId;
    if (parent.children.leftId === vertexId) {
        survivingSilblingId = parent.children.rightId;
    } else if (parent.children.rightId === vertexId) {
        survivingSilblingId = parent.children.leftId;
    } else {
        throw new Error("Vertex is not a child of the parent");
    }

    const survivingSilbling = tree[survivingSilblingId];
    const cloneOfSurvivingSilbling = {...survivingSilbling};

    let [t1, newId] = appendVertexB(tree, false);
    tree = produce(t1, (draft) => {
        delete draft[vertexId];
        delete draft[survivingSilblingId];
        (draft[newId] as Vertex) = cloneOfSurvivingSilbling;
        (draft[newId] as Vertex).id = newId;
        if (cloneOfSurvivingSilbling.type === "c") {
            const leftId = cloneOfSurvivingSilbling.children.leftId;
            const rightId = cloneOfSurvivingSilbling.children.rightId;
            draft[leftId].parentId = newId;
            draft[rightId].parentId = newId;
        }
    });

    tree = overwriteVertex(tree, v.parentId, newId);
    // //console.log(JSON.stringify(tree,null,2))


    if (DEBUG) {
        assertTreeIntegrity(tree);
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

/** Run only when DEBUG === true.  Throws on *any* structural violation. */
function assertTreeIntegrity(tree: Tree): void {

    //console.log("Asserting tree integrity");
    //console.log(JSON.stringify(tree, null, 2));

    // ---------- 1. Exactly one root ----------
    const rootIds = Object.values(tree)
        .filter(v => v.root === true)
        .map(v => v.id);

    if (rootIds.length !== 1) {
        throw new Error(
            `Tree integrity error: expected exactly one root, found ${rootIds.length} → [${rootIds.join(
                ", "
            )}]`
        );
    }
    const rootId = rootIds[0];

    // ---------- 2. DFS walk, checking bidirectional links ----------
    const visited = new Set<string>();

    const dfs = (id: string, parentId: string | undefined): void => {
        const v = tree[id];
        if (!v) {
            throw new Error(`Tree integrity error: missing vertex “${id}”`);
        }
        if (visited.has(id)) {
            throw new Error(`Tree integrity error: cycle detected at “${id}”`);
        }
        visited.add(id);

        // parent pointer must agree with traversal
        if (v.parentId !== parentId) {
            throw new Error(
                `Tree integrity error: vertex “${id}” claims parent “${v.parentId}”, but traversal parent is “${parentId}”`
            );
        }

        switch (v.type) {
            case "b": {
                // leaf must NOT have children
                if ((v as any).children !== undefined) {
                    throw new Error(`Tree integrity error: leaf “${id}” owns children`);
                }
                break;
            }

            case "c": {
                const { leftId, rightId } = v.children;

                // children must exist …
                if (!tree[leftId] || !tree[rightId]) {
                    throw new Error(
                        `Tree integrity error: internal node “${id}” points to non-existent child`
                    );
                }
                // … and point back.
                if (tree[leftId].parentId !== id) {
                    throw new Error(
                        `Tree integrity error: child “${leftId}” does not acknowledge parent “${id}”`
                    );
                }
                if (tree[rightId].parentId !== id) {
                    throw new Error(
                        `Tree integrity error: child “${rightId}” does not acknowledge parent “${id}”`
                    );
                }

                // percentage must lie in [0, 1]
                const pct = v.percentage;
                if (pct < 0 || pct > 1) {
                    throw new Error(
                        `Tree integrity error: internal node “${id}” has out-of-bounds percentage ${pct}`
                    );
                }

                dfs(leftId, id);
                dfs(rightId, id);
                break;
            }

            default:
                /* Exhaustiveness guarantee */
                const _never: never = v;
                throw new Error(`Unknown vertex type at “${id}”`);
        }
    };

    dfs(rootId, undefined);

    // ---------- 3. No orphans ----------
    if (visited.size !== Object.keys(tree).length) {
        const orphans = Object.keys(tree).filter(id => !visited.has(id));
        throw new Error(
            `Tree integrity error: found ${orphans.length} disconnected vertex/vertices → [${orphans.join(
                ", "
            )}]`
        );
    }
    //console.log("Tree integrity check passed");
}



export { split, close, defaultTree, setDebug, setPercentage, setPayload, findChild }