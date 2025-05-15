import { KernelCore } from "../KernelCore";
import { SideEffect } from "../SideEffect";
import { CK_Instance, CK_Unit, CK_InstallUnit, CK_Workload } from "../types";

export class AutoInstallSideEffect implements SideEffect {
  /* installed & queued receivers */
  private readonly installed: Record<string, CK_Instance> = {};
  private readonly queued = new Set<string>();

  constructor(private readonly kernel: KernelCore) { }

  getInstalled() {
    return Object.values(this.installed);
  }

  processReceivedWorkload(workload: CK_Workload): CK_Workload {
    const clone: CK_Workload = structuredClone(workload);

    for (const tid of Object.keys(clone)) {
      const out: CK_Unit[] = [];
      for (const u of clone[tid]) {
        if (u.type === "worker") {
          const receiverKey = this.idOf(u.receiver);
          if (!Object.keys(this.installed).includes(receiverKey) && !this.queued.has(receiverKey)) {
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
          if (!Object.keys(this.installed).includes(receiverKey) && !this.queued.has(receiverKey)) {
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


  // stepComplete(unit: CK_Unit) {
  //   if (unit.type === "install") {
  //     this.installed[this.idOf(unit.instance)] = unit.instance;
  //     this.queued.delete(this.idOf(unit.instance));
  //   }
  //   if (unit.type === "terminate") {
  //     delete this.installed[this.idOf(unit.instance)];
  //   }
  // }

  instanceInstalled(instance: CK_Instance, metadata: unknown): void {
    const enriched = {
      ...instance,
      metadata,
    }
    this.installed[this.idOf(instance)] = enriched;
    this.queued.delete(this.idOf(instance));
  }

  instanceTerminated(instance: CK_Instance): void {
    delete this.installed[this.idOf(instance)];
  }

  terminateAllInstances() {
    const units: CK_Unit[] = [];
    for (const id of Object.keys(this.installed)) {
      const instance = this.installed[id];
      const unit: CK_Unit = {
        type: "terminate",
        instance,
        id: crypto.randomUUID(),
      };
      units.push(unit);
    }
    this.kernel.pushWorkload({
      "default": units,
    })

  }

  getRegistry() {
    return Object.values(this.installed)
  }

  private idOf(i: CK_Instance) {
    return `${i.modality}::${i.resource_id}::${i.instance_id}`;
  }
}
