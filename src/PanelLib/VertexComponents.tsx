import React, { createContext, useContext, useState } from "react";
import { Tree, VertexB, VertexC } from "./types";
import { defaultTree, split, close, setDebug, setPercentage } from "./VertexOperations";
import ContentComponent from "../ContentComponent/ContentComponent";

const TreeContext = createContext<[Tree, (t: Tree) => void] | null>(null);

const TreeComponent: React.FC = () => {
    const [tree, setTree] = useState<Tree>(defaultTree()[0]);

    setDebug();

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

    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateRows: "23px 1fr",


            
            padding: "2px",
            boxSizing: "border-box",
            overflow: "hidden",
        }}>
            <div style={{
                backgroundColor: "rgb(230, 230, 230)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTopLeftRadius: "5px",
                borderTopRightRadius: "5px",
                padding: "5px",
            }}>
                <div></div>
                <div style={{
                    display: "flex",
                    gap: "2px",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    alignItems: "center",
                }}>
                    <button 
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                        }}
                    onClick={() => {
                        const newTree = split(tree, id, "row");
                        setTree(newTree);
                    }}>|</button>
                    <button 
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                        }}
                    onClick={() => {
                        const newTree = split(tree, id, "column");
                        setTree(newTree);
                    }}>—</button>
                    <button 
                        style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "8px",
                        }}
                    onClick={() => {
                        const newTree = close(tree, id);
                        setTree(newTree);
                    }}>X</button>
                </div>
            </div>
            <div>            
                <ContentComponent id={id} />
            </div>

        </div>
    );
}

const VertexCComponent: React.FC<{ id: string }> = ({ id }) => {

    const [dragging, setDragging] = useState(false);

    const ref = React.useRef<HTMLDivElement>(null);

    console.log("dragging", dragging);

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
            return <VertexBComponent key={childId} id={childId} />;
        }
        if (v.type === "c") {
            return <VertexCComponent key={childId} id={childId} />;
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
            userSelect: dragging ? "none" : "auto",
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
                // console.log("mouse up")
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