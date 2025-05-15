import { CK_Instance, CK_Workload } from '../types';
import {SideEffect} from '../SideEffect';
import { AutoInstallSideEffect } from './AutoInstallSideEffect';

type Subscriber = () => void;

class ObservabilitySideEffect implements SideEffect {

  private autoInstall: AutoInstallSideEffect;
  constructor(autoInstall: AutoInstallSideEffect) {
    this.autoInstall = autoInstall;
  }

  private subs: Set<Subscriber> = new Set();
  snapshot: {
    plate: CK_Workload;
    pending: CK_Workload[];
    mode: EmissionMode;
    instances: CK_Instance[];
  } = {
    plate: {},
    pending: [],
    mode: "SILENT",
    instances: [],
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
      instances: Array.from(this.autoInstall.getInstalled()),
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
        instances: Array.from(this.autoInstall.getInstalled()),
    }
  }

  pushWorkloadComplete() {
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