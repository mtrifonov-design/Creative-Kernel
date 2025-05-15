import { KernelCore } from "../KernelCore";
import { CK_Unit, CK_Workload } from "../types";
import { SideEffect } from "../SideEffect";

class RecordingSideEffect implements SideEffect {

    constructor(private kernel: KernelCore) {
        this.kernel = kernel;
    }

    private isRecording: boolean = false;
    private recordedWorkloads: CK_Workload[] = [];

    startRecording() {
        this.isRecording = true;
        this.recordedWorkloads = [];
    }

    stopRecording() {
        this.isRecording = false;
    }


    getRecordedWorkloads(): CK_Workload[] {
        return this.recordedWorkloads;
    }

    serializeToJson(): string {
        return JSON.stringify(this.recordedWorkloads, null, 2);
    }

    loadFromJson(json: string) {
        try {
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed)) {
                console.log("Loaded recording from JSON:", parsed);
                this.recordedWorkloads = parsed;
            } else {
                throw new Error("Invalid JSON format");
            }
        } catch (error) {
            console.error("Failed to load recording from JSON:", error);
        }
    }

    pushToPending() {
        console.log("Pushing recorded workloads to pending");
        console.log(this.recordedWorkloads);
        this.recordedWorkloads.forEach((workload) => {
            console.log("Pushing workload:", workload);
            this.kernel.pushWorkload(workload);
        });
    }

    workloadWasPushed(workload: CK_Workload): void {
        if (this.isRecording) {
            console.log("Recording workload:", workload);
            this.recordedWorkloads.push(JSON.parse(JSON.stringify(workload)));
        }
    }

}

export default RecordingSideEffect;
