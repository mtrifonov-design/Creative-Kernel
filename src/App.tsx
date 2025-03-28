import React from 'react';
import { TreeComponent } from './PanelLib/VertexComponents';
import './App.css';
const App: React.FC = () => {
    return <TreeComponent />
}


// import { produce } from 'immer';

// import ContentBox from './ContentBox';

// type Vertex = {
//   type: 'leaf' | 'branch';
//   id: string;
//   children?: {
//     [key: string]: Vertex;
//   };
//   direction?: 'row' | 'column';
// }

// function findParent(v: Vertex, vertexId: string): Vertex | undefined {
//   if (v.children === undefined) {
//     return undefined;
//   }
//   if (Object.keys(v.children).includes(vertexId)) {
//     return v;
//   }
//   for (const childId in v.children) {
//     const child = v.children[childId];
//     const found = findParent(child, vertexId);
//     if (found) {
//       return found;
//     }
//   }
//   return undefined;
// }

// function split(tree: Vertex, vertexId: string, direction: string): Vertex {
//     return produce(tree, (draft) => {
//         const parent = findParent(draft, vertexId);
//         if (!parent || !parent.children) {
//             throw new Error('Parent not found or has no children');
//         }
//         // replace the vertex with a branch
//         const branchId = generateId();
//         const leafId = generateId();
//         const newBranch : Vertex = {
//             type: 'branch' as Vertex['type'],
//             direction: direction as Vertex['direction'],
//             id: branchId,
//             children: {
//                 [vertexId]: parent.children[vertexId],
//                 [leafId]: {
//                     id: leafId,
//                     type: 'leaf',
//                 }
//             }
//           }
//         parent.children[branchId] = newBranch;
//         delete parent.children[vertexId];
//   })
// } 

// function close(tree: Vertex, vertexId: string): Vertex {
//     return produce(tree, (draft) => {
//         const parent = findParent(draft, vertexId);
//         if (!parent || !parent.children) {
//             throw new Error('Parent not found or has no children');
//         }
//         const onlyChildId = Object.keys(parent.children).filter((childId) => childId !== vertexId)[0];
//         const onlyChild = parent.children[onlyChildId];
//         const id = parent.id;
//         const parentParent = findParent(draft, id);
//         if (!parentParent || !parentParent.children) {
//             throw new Error('Parent not found or has no children');
//         }
//         delete parentParent.children[parent.id];
//         parentParent.children[onlyChildId] = onlyChild;
//   })
// }


// const App: React.FC = () => {



//     const [tree, setTree] = useState<Vertex>({
//         children: {
//           root: {
//             id: 'root',
//             type: 'leaf'
//           }
//         },
//         id: 'root_branch',
//         type: 'branch',
//         direction: 'row'
//     });
//     ////console.log("RENDER", tree)

//     return <VertexC self={tree} tree={tree} setTree={setTree}  />
// }

// const VertexC: React.FC<{ self: vertex, tree: Vertex, setTree: (tree: Vertex) => void }> = ({ self, tree, setTree }) => {
//   if (self.type === 'leaf') {
//       return <Leaf key={self.id} self={self} tree={tree} setTree={setTree} />
//   } else {
//     return (
//       <div style={{
//         display: "flex",
//         flexDirection: self.direction,
//         width: "100%",
//         height: "100%",
//         justifyContent: 'space-evenly',
        
//       }}>
//         {Object.values(self.children || {}).map((child) => (
//           <VertexC
//             key={child.id}
//             self={child}
//             tree={tree}
//             setTree={setTree}
//           />
//         ))}
//       </div>
//     )
//   }
// }

// const Leaf: React.FC<{ self: Vertex, tree: Vertex, setTree:(v:Vertex) => void }> = ({ self, tree, setTree }) => {
//   const splitPanel = (direction: string) => {
//     setTree(split(tree, self.id, direction));
//   }
//   const closePanel = () => {
//     setTree(close(tree, self.id));
//   }

//   return (<div
//   style={{
//     border: "1px solid black",
//     width: "100%",
//     height: "100%",
//     display: "flex",
//     flexDirection: "column",

//   }}
//   >
//     <div style={{
//       height: "30px",
//       backgroundColor: "lightgray",
//       display: "flex",
//       justifyContent: "flex-end",
//       gap: "5px",
//       flexDirection: "row",
//       padding: "5px",
//     }}>
//       <button onClick={() => splitPanel("column")}>—</button>
//       <button onClick={() => splitPanel("row")}>|</button>
//       <button onClick={() => closePanel()}>X</button>
//     </div>

//       <ContentBox id={self.id} />

//   </div>)

// };

// const generateId = () => {
//     return "id"+Math.random().toString(36).substr(2, 9);
// }

export default App;

