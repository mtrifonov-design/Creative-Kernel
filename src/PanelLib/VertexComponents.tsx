import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { Tree, Vertex, VertexB, VertexC } from "./types";
import { split, close, setPercentage, setPayload } from "./VertexOperations";
import ContentComponent from "../ContentComponent/ContentComponent";




function setTree(tree: Tree) {
    const uiModality = globalThis.UI_MODALITY;
    if (!uiModality) {
        throw new Error("UI modality not found");
    }
    uiModality.setTree(tree);
}

function subscribe(callback: () => void) {
    const uiModality = globalThis.UI_MODALITY;
    if (!uiModality) {
        throw new Error("UI modality not found");
    }
    return uiModality.treeManager.subscribe(callback);
}

function getSnapshot() {
    const uiModality = globalThis.UI_MODALITY;
    if (!uiModality) {
        throw new Error("UI modality not found");
    }
    return uiModality.treeManager.getTree();
}

const TreeContext = createContext<[Tree, (t: Tree) => void] | null>(null);
const DraggingContext = createContext<[boolean, string | null, (b: boolean) => void, (s: string) => void] | null>(null);

const TreeComponent: React.FC = () => {



    const { tree } = useSyncExternalStore(subscribe, getSnapshot);
    const [dragging, setDragging] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    useEffect(() => {
        // //console.log("TreeComponent mounted");
        globalThis.UI_MODALITY.rendered();
    })

    // setDebug();

    const root : Vertex = (Object.values(tree) as Vertex[]).find((v : Vertex) => v.root)!;
    if (!root) {
        return <div>No root found</div>;
    }

    return (
    <div
    style={{
        width: "100%",
        height: "100%",
        userSelect: dragging ? "none" : "auto",
    }}
    onMouseUp={() => setDragging(false)}
    >
        <TreeContext.Provider value={[tree, setTree]}>
            <DraggingContext.Provider value={[dragging, draggingId, setDragging, setDraggingId]}>
            {   root.type === "b" ?
                <VertexBComponent id={root.id} key={root.id} />
                : root.type === "c" ?
                <VertexCComponent id={root.id} key={root.id} />
                : <></>
            }
            </DraggingContext.Provider>
        </TreeContext.Provider>
    </div>
    );

}

const VertexBComponent: React.FC<{ id: string }> = ({ id }) => {
    const [tree, setTree] = useContext(TreeContext)!;
    const vertex = tree[id] as VertexB;

    if (!vertex) {
        return <div>Vertex not found</div>;
    }

    const splitRow = () => {
        const newTree = split(tree, id, "row");
        setTree(newTree);
    }
    const splitColumn = () => {
        const newTree = split(tree, id, "column");
        setTree(newTree);
    }
    const closePanel = () => {
        const newTree = close(tree, id);
        setTree(newTree);
    }
    const payload = vertex.payload;
    const setNewPayload = (newPayload: any) => {
        const newTree = setPayload(tree, id, newPayload);
        setTree(newTree);
    }

    return (
        <ContentComponent 
            id={id} 
            payload={payload}
            setPayload={setNewPayload}
            splitRow={splitRow}
            splitColumn={splitColumn}
            closePanel={closePanel}
            parentId={vertex.parentId}
        />
    );
}

const VertexCComponent: React.FC<{ id: string }> = ({ id }) => {

    const [dragging, draggingId, setDragging, setDraggingId] = useContext(DraggingContext)!;

    const localDragging = (draggingId === id) && dragging;
    const setLocalDragging = (b: boolean) => {
        setDragging(b);
        setDraggingId(id);
    }

    const ref = React.useRef<HTMLDivElement>(null);


    const [tree, setTree] = useContext(TreeContext)!;
    const vertex = tree[id] as VertexC;

    const direction = vertex.direction;
    const percentage = vertex.percentage;

    if (!vertex) {
        return <div>Vertex not found</div>;
    }

    const children = Object.values(vertex.children);

    const renderChild = (childId: string) => {
        const v = tree[childId];
        // const parentId = v.parentId;
        if (v.type === "b") {
            return <div style={{pointerEvents: dragging ? "none" : "auto"}}>
                <VertexBComponent key={childId} id={childId} />
            </div>;
        }
        if (v.type === "c") {
            return <div>
                <VertexCComponent key={childId} id={childId} />
            </div>;
        }
        return null;
    }

    const sepWidth = 8;
    const expr = `calc(${percentage * 100}% - ${sepWidth / 2}px) ${sepWidth}px calc(${100 - percentage * 100}% - ${sepWidth / 2}px)`;

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: direction === "row" ? expr : "1fr",
            gridTemplateRows: direction === "column" ? expr : "1fr",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            cursor: dragging ? "grabbing" : "default",
            
        }}
            onMouseMove={(event) => {
                if (!localDragging) {
                    return;
                }
                if (!ref.current) {
                    return;
                }
                const rect = ref.current.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;
                const newPercentage = direction === "row" ? x : y;
                const newTree = setPercentage(tree, id, newPercentage);
                setTree(newTree);
            }}
            ref={ref}
        >
            {renderChild(children[0])}
            <Separator direction={direction} setDragging={setLocalDragging} dragging={localDragging} />
            {renderChild(children[1])}
        </div>
    );
}

const Separator: React.FC<{direction: string, setDragging: (b: boolean) => void, dragging: boolean }> = ({direction, setDragging, dragging}) => {
    const [hover, setHover] = useState(false);
    const displayBar = dragging ? true : hover ? true : false;

    return (
        <div style={{
            padding: "2px",
            boxSizing: "border-box",
            width: "100%",
            height: "100%",
            cursor: direction === "row" ? "ew-resize" : "ns-resize",
        }}
        onMouseEnter={() => {
            setHover(true);
        }}
        onMouseLeave={() => {
            setHover(false);
        }}
        onMouseDown={() => {
            setDragging(true);
        }}
        >
            <div style={{
                backgroundColor: displayBar ? "white" : "transparent",
                width: "100%",
                height: "100%",
                borderRadius: "5px",
            }}></div>
        </div>
    );
};



export { TreeComponent, VertexBComponent, VertexCComponent };