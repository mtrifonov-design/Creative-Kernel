type CK_Unit =
    | CK_WorkerUnit | CK_InstallUnit | CK_BlockerUnit | CK_TerminateUnit;

type CK_Instance = {
    modality: string;
    resource_id: string;
    instance_id: string;
    metadata?: unknown;
}

type CK_WorkerUnit = {
    type: 'worker';
    receiver: CK_Instance;
    sender: CK_Instance;
    payload: unknown;
    id: string;
}

type CK_InstallUnit = {
    type: 'install';
    instance: CK_Instance;
    id: string;
    metadata?: unknown;
}

type CK_TerminateUnit = {
    type: 'terminate';
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
    installUnit: (unit: CK_InstallUnit) => Promise<false | { [key: string]: unknown }>;
    computeUnit: (unit: CK_WorkerUnit) => Promise<{ [threadId: string]: CK_Unit[] }>;
    terminateUnit: (unit: CK_TerminateUnit) => Promise<boolean>;
}

type CK_Workload = { [threadId: string]: CK_Unit[] };

export type {
    CK_Modality,
    CK_Unit,
    CK_WorkerUnit,
    CK_InstallUnit,
    CK_TerminateUnit,
    CK_BlockerUnit,
    CK_Instance,
    CK_Threads,
    CK_Workload,
}