import { SideEffect } from './SideEffect';
import { CK_Modality, CK_Workload, CK_Unit, CK_BlockerUnit } from './types';

export class KernelCore {
    private plate: CK_Workload = {};
    private pending: CK_Workload[] = [];

    constructor(
        private readonly modalities: { [m: string]: CK_Modality },
        private readonly sideEffects: SideEffect[] = []
    ) {
    }

    addSideEffect(se: SideEffect): void {
        this.sideEffects.push(se);
    }

    pushWorkload(original: CK_Workload): void {
        // 1. side‑effect rewrite
        let workload = original;
        for (const se of this.sideEffects) if (se.workloadWasPushed) se.workloadWasPushed(workload);
        for (const se of this.sideEffects) {
            workload = se.processReceivedWorkload ? se.processReceivedWorkload(workload) : workload;
        }
        if (this.isEmpty(this.plate)) {
            this.plate = workload;
        } else {
            this.pending.push(structuredClone(workload));
        }

        for (const se of this.sideEffects) if (se.updateGlobalState) se.updateGlobalState(this.plate, this.pending);
        for (const se of this.sideEffects) if (se.pushWorkloadComplete) se.pushWorkloadComplete(workload);
    }

    /**
     * Execute *one* kernel step. 
     */
    async step(): Promise<void> {
        if (this.isEmpty(this.plate) && this.pending.length > 0) {
            this.plate = this.pending.shift()!;
        }

        this.resolveBlockedThreads();
        this.resolveEmptyThreads();

        if (this.isEmpty(this.plate)) {
            this.sideEffects.forEach((s) => {if (s.updateGlobalState) s.updateGlobalState(this.plate, this.pending)});
            this.sideEffects.forEach((s) => {if (s.workloadComplete) s.workloadComplete()});
            return;
        }

        const eligibleTid = this.chooseEligibleThreadId();
        if (!eligibleTid) {
            throw new Error("No eligible thread id found, Kernel is in a deadlock state!");
        }
        //console.log(JSON.stringify(this.plate,null,2), eligibleTid);

        const unit = this.plate[eligibleTid].shift();

        if (!unit) {
            throw new Error('No unit found where we expected one');
        }

        let delta: CK_Workload = {};
        if (unit.type === "worker") {
            delta = await this.modalities[unit.receiver.modality].computeUnit(unit);
        } else if (unit.type === "install") {
            await  this.modalities[unit.instance.modality].installUnit(unit);
        } else if (unit.type === "terminate") {
            await this.modalities[unit.instance.modality].terminateUnit(unit);
        } else {
            throw new Error(`Unknown unit type: ${unit.type}`);
        }

        for (const se of this.sideEffects) {
            delta = se.processReceivedDelta ? se.processReceivedDelta(delta) : delta;
        }
        this.applyDelta(delta);

        this.resolveEmptyThreads();

        this.sideEffects.forEach((s) => {if (s.updateGlobalState) s.updateGlobalState(this.plate, this.pending)});
        this.sideEffects.forEach((s) => {if (s.stepComplete) s.stepComplete(unit)});

        return;
    }

    /* --------------------------- HELPERS --------------------------- */
    private isEmpty(w: CK_Workload): boolean {
        return Object.keys(w).length === 0;
    }

    private chooseEligibleThreadId(): string | undefined {
        return Object.keys(this.plate).find(
            (tid) => this.plate[tid][0]?.type !== "blocker"
        );
    }

    private resolveBlockedThreads(): void {
        // Detect mature blocker sets
        const fronts = Object.values(this.plate).map((q) => q[0]).filter(Boolean) as CK_Unit[];
        const blockerFronts = fronts.filter((u) => u.type === "blocker") as CK_BlockerUnit[];

        const grouped: Record<string, CK_BlockerUnit[]> = {};
        blockerFronts.forEach((b) => {
            (grouped[b.blocker_id] ??= []).push(b);
        });

        const matureIds = Object.keys(grouped).filter(
            (bid) => grouped[bid].length === grouped[bid][0].blocker_count
        );

        if (matureIds.length === 0) return;

        // Remove mature blockers
        for (const tid of Object.keys(this.plate)) {
            const q = this.plate[tid];
            if (q[0]?.type === "blocker" && matureIds.includes(q[0].blocker_id)) {
                q.shift();
                if (q.length === 0) delete this.plate[tid];
            }
        }

        // recurse – there may be new blockers now at front
        this.resolveBlockedThreads();
    }

    private resolveEmptyThreads(): void {
        for (const tid of Object.keys(this.plate)) {
            const q = this.plate[tid];
            if (q.length === 0) {
                delete this.plate[tid];
            }
        }
    }

    private applyDelta(delta: CK_Workload) {
        for (const tid of Object.keys(delta)) {
            const src = delta[tid];
            if (src.length === 0) continue;

            if (!this.plate[tid]) this.plate[tid] = [];
            this.plate[tid].push(...structuredClone(src));
        }
    }
}