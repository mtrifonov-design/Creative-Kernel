import { SideEffect } from "../SideEffect";
import { CK_Instance, CK_Unit, CK_InstallUnit, CK_Workload } from "../types";

export class AutoInstallSideEffect implements SideEffect {
  /* installed & queued receivers */
  private readonly installed = new Set<string>();
  private readonly queued = new Set<string>();

  constructor(private readonly idOf: (inst: CK_Instance) => string = AutoInstallSideEffect.defaultIdOf) { }

  processReceivedWorkload(workload: CK_Workload): CK_Workload {
    const clone: CK_Workload = structuredClone(workload);

    for (const tid of Object.keys(clone)) {
      const out: CK_Unit[] = [];
      for (const u of clone[tid]) {
        if (u.type === "worker") {
          const receiverKey = this.idOf(u.receiver);
          if (!this.installed.has(receiverKey) && !this.queued.has(receiverKey)) {
            this.queued.add(receiverKey);
            out.push({
              type: "install",
              instance: u.receiver,
              id: crypto.randomUUID(),
            } as CK_InstallUnit);
          }
        }
        out.push(u);
      }
      clone[tid] = out;
    }
    return clone;
  }

  processReceivedDelta(workload: CK_Workload): CK_Workload {
    const clone: CK_Workload = structuredClone(workload);

    for (const tid of Object.keys(clone)) {
      const out: CK_Unit[] = [];
      for (const u of clone[tid]) {
        if (u.type === "worker") {
          const receiverKey = this.idOf(u.receiver);
          if (!this.installed.has(receiverKey) && !this.queued.has(receiverKey)) {
            this.queued.add(receiverKey);
            out.push({
              type: "install",
              instance: u.receiver,
              id: crypto.randomUUID(),
            } as CK_InstallUnit);
          }
        }
        out.push(u);
      }
      clone[tid] = out;
    }
    return clone;
  }

  workloadComplete(): void {
  }

  updateGlobalState(plate: CK_Workload): void {
  }
  workloadWasPushed() { }
  stepComplete(unit: CK_Unit) {
    if (unit.type === "install") {
      this.installed.add(this.idOf(unit.instance));
      this.queued.delete(this.idOf(unit.instance));
    }
    if (unit.type === "terminate") {
      this.installed.delete(this.idOf(unit.instance));
    }
  }

  getRegistry() {
    return Array.from(this.installed);
  }

  private static defaultIdOf(i: CK_Instance) {
    return `${i.modality}:${i.resource_id}:${i.instance_id}`;
  }
}
