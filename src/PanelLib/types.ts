type VertexC = {
    type: 'c';
    id: string;
    children: {
        "leftId": string;
        "rightId": string;
    };
    direction: string;
    percentage: number;
    parentId?: string;
    root?: boolean;
};


type VertexB = {
    type: 'b';
    id: string;
    inhabited: boolean;
    parentId?: string;
    root?: boolean;
}

type Tree = {
    [key: string]: Vertex;
}

type Vertex =
| VertexC
| VertexB

export type { VertexC, VertexB, Tree };


