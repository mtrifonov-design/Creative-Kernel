import React, { createContext, useContext, useState, useSyncExternalStore } from "react";
import { Tree, VertexB, VertexC } from "./types";
import { split, close, setPercentage } from "./VertexOperations";
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
const TreeComponent: React.FC = () => {



    const tree = useSyncExternalStore(subscribe, getSnapshot);

    // const [tree, setTree] = useState<Tree>(defaultTree()[0]);

    // setDebug();

    const root = Object.values(tree).find((v) => v.root);
    if (!root) {
        return <div>No root found</div>;
    }

    if (root.type === "b") {
        return <TreeContext.Provider value={[tree, setTree]}>
            <VertexBComponent id={root.id} key={root.id} />
        </TreeContext.Provider>
    }
    if (root.type === "c") {
        return <TreeContext.Provider value={[tree, setTree]}>
            <VertexCComponent id={root.id} key={root.id} />
        </TreeContext.Provider>
    }
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

    return (
        <ContentComponent id={id} 
            splitRow={splitRow}
            splitColumn={splitColumn}
            closePanel={closePanel}
        />
    );
}

const VertexCComponent: React.FC<{ id: string }> = ({ id }) => {

    const [dragging, setDragging] = useState(false);

    const ref = React.useRef<HTMLDivElement>(null);

    ////console.log("dragging", dragging);

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
        if (v.type === "b") {
            return <div style={{pointerEvents: dragging ? "none" : "auto"}}>
                <VertexBComponent key={childId} id={childId} />
            </div>;
        }
        if (v.type === "c") {
            return <div style={{pointerEvents: dragging ? "none" : "auto"}}>
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
                if (!dragging) {
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
            onMouseUp={() => {
                setDragging(false);
                // ////console.log("mouse up")
            }}

            ref={ref}
        >
            {renderChild(children[0])}
            <Separator direction={direction} setDragging={setDragging} />
            {renderChild(children[1])}
        </div>
    );
}

const Separator: React.FC<{direction: string, setDragging: (b: boolean) => void }> = ({direction, setDragging}) => {
    return (
        <div style={{
            padding: "2px",
            boxSizing: "border-box",
            width: "100%",
            height: "100%",
            cursor: direction === "row" ? "ew-resize" : "ns-resize",
        }}
        onMouseDown={(e) => {
            setDragging(true);
        }}
        >
            <div style={{
                backgroundColor: "gray",
                width: "100%",
                height: "100%",
                borderRadius: "5px",
            }}></div>
        </div>
    );
};


export { TreeComponent, VertexBComponent, VertexCComponent };