import { KernelCore } from "../KernelCore";
import { SideEffect } from "../SideEffect";
import { CK_Workload } from "../types";

export class AutoRunSideEffect implements SideEffect {
    private running = false;
    constructor(private readonly kernel: KernelCore) { }

    processReceivedWorkload(w: CK_Workload) {
        return w; // no rewrite
    }

    plate: CK_Workload = {};
    pending: CK_Workload[] = [];
    mode: "STEP" | "WORKLOAD" | "SILENT" = "STEP";

    setMode(m: "STEP" | "WORKLOAD" | "SILENT") {
        this.mode = m;
    }

    updateGlobalState(plate: CK_Workload, pending: CK_Workload[]) {
        this.plate = plate;
        this.pending = pending;
    }

    async workloadWasPushed() {
        if (this.mode === "WORKLOAD" || this.mode === "SILENT") {
            if (!this.running) {
                this.running = true;
                this.kernel.step();
            }
        }
    }

    stepComplete() {
        if (this.mode === "WORKLOAD" || this.mode === "SILENT") {
            if (this.running) {
                this.kernel.step();
            }
        }
    }


    workloadComplete() {
        this.running = false;
        if (this.mode === "SILENT") {
            if (this.pending.length > 0) {
                this.running = true;
                this.kernel.step();
            }
        }
    }


}
