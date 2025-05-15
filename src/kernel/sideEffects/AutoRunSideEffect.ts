import { KernelCore } from "../KernelCore";
import { SideEffect } from "../SideEffect";
import { CK_Workload } from "../types";

export class AutoRunSideEffect implements SideEffect {
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

    running = false;
    pushWorkloadComplete() {
        if (this.mode === "SILENT" && this.running === false) {
            this.running = true;
            this.kernel.step();
        }
    }

    processReceivedDelta(delta: CK_Workload): CK_Workload {
        return delta;
    }

    stepComplete() {
        //console.log("Step complete");
        if (this.mode === "WORKLOAD" || this.mode === "SILENT") {
            this.kernel.step();
        }
    }


    workloadComplete() {
        if (this.mode === "SILENT") {
            if (this.pending.length > 0 || Object.keys(this.plate).length > 0) {
                this.kernel.step();
            } else if (this.pending.length === 0) {
                this.running = false;
            }
        }
    }


}
