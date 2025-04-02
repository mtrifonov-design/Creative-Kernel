type CK_Unit =
    | CK_WorkerUnit | CK_InstallUnit | CK_BlockerUnit;

type CK_Instance = {
    modality: string;
    resource_id: string;
    instance_id: string;
}

type CK_WorkerUnit = {
    type: 'worker';
    receiver: CK_Instance;
    sender: CK_Instance;
    payload: any;
    id: string;
}
type CK_InstallUnit = {
    type: 'install';
    instance: CK_Instance;
    id: string;
}
type CK_BlockerUnit = {
    type: 'blocker';
    blocker_id: string;
    blocker_count: number;
    id: string;
}

type CK_Threads = {
    [key: string]: CK_Unit[];
}


interface CK_Modality {
    installUnit: (unit: CK_InstallUnit) => Promise<boolean>;
    computeUnit: (unit: CK_WorkerUnit) => Promise<{ [threadId: string]: CK_Unit[] }>;
}

export {
    CK_Modality,
    CK_Unit,
    CK_WorkerUnit,
    CK_InstallUnit,
    CK_BlockerUnit,
    CK_Instance,
    CK_Threads
}