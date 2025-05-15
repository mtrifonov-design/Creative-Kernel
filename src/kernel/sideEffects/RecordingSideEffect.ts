import { CreativeKernel } from "../CreativeKernel";
import { CK_Unit, CK_Workload } from "../types";
import { SideEffect } from "../SideEffect";

class RecordingSideEffect implements SideEffect {

    constructor(private kernel: CreativeKernel) {
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


    isPlaying = false;
    currentIndex = 0;
    pushToPending() {
        console.log("Pushing recorded workloads to pending");
        console.log(this.recordedWorkloads);

        this.isPlaying = true;
        this.currentIndex = 0;
        if (this.recordedWorkloads[0] !== undefined) {
            this.kernel.pushWorkload(this.recordedWorkloads[0]);
        } else {
            this.isPlaying = false;
            console.error("No recorded workloads to push");
            return;
        }
    }

    workloadComplete(): void {
        if (this.isPlaying) {
            this.currentIndex++;
            if (this.currentIndex < this.recordedWorkloads.length) {
                const workload = this.recordedWorkloads[this.currentIndex];
                setTimeout(() => {
                    this.kernel.pushWorkload(workload);
                }, 50); 
            } else {
                this.isPlaying = false;
                console.log("Finished playing recorded workloads");
            }
        }
        
    }

    workloadWasPushed(workload: CK_Workload): void {
        if (this.isRecording) {
            this.recordedWorkloads.push(JSON.parse(JSON.stringify(workload)));
        }
    }

}

export default RecordingSideEffect;
