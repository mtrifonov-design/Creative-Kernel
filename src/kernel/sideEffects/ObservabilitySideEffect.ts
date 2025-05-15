import { CK_Workload } from '../types';
import {SideEffect} from '../SideEffect';

type Subscriber = () => void;

class ObservabilitySideEffect implements SideEffect {
  private subs: Set<Subscriber> = new Set();
  snapshot: {
    plate: CK_Workload;
    pending: CK_Workload[];
    mode: EmissionMode;
  } = {
    plate: {},
    pending: [],
    mode: "SILENT",
  };
    

  subscribe(fn: Subscriber) {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  getSnapshot() {
    return this.snapshot;
  }

  get mode() {
    return this.snapshot.mode;
  }


  setMode(m: EmissionMode) {
    this.snapshot = {
      ...this.snapshot,
      mode: m,
    }
    this.fire();
  }

  workloadComplete(): void {
    if (this.mode === "WORKLOAD" 
      || this.mode === "STEP"
      || (this.mode === "SILENT" && this.snapshot.pending.length === 0)
    ) {
      this.fire();
    }
  }

  /* SideEffect hooks */
  processReceivedWorkload(w: CK_Workload) {
    return w;
  }

  processReceivedDelta(delta: CK_Workload): CK_Workload {
      return delta;
  }

  updateGlobalState(plate: CK_Workload, pending: CK_Workload[]) {
    this.snapshot = {
        plate: structuredClone(plate),
        pending: pending,
        mode: this.mode,
    }
  }

  workloadWasPushed() {
    if (this.mode === "WORKLOAD" || this.mode === "STEP") {
      this.fire();
    }
  }
  stepComplete() {
    if (this.mode === "STEP") {
      this.fire();
    }
  }

  private fire() {
    this.subs.forEach((s) => s());
  }
}

export type EmissionMode = "STEP" | "WORKLOAD" | "SILENT";

export { ObservabilitySideEffect };