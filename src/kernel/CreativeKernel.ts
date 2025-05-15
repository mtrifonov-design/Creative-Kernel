import { CK_Workload, CK_Modality } from './types';
import { KernelCore } from './KernelCore';
import  { ObservabilitySideEffect, EmissionMode } from "./sideEffects/ObservabilitySideEffect";
import {AutoRunSideEffect} from './sideEffects/AutoRunSideEffect';
import {AutoInstallSideEffect} from './sideEffects/AutoInstallSideEffect';

export default class CreativeKernel {
  private readonly core: KernelCore;
  private readonly obs: ObservabilitySideEffect;
  private readonly autoInstall: AutoInstallSideEffect;
  private readonly autoRun: AutoRunSideEffect;

  constructor(modalities: { [k: string]: CK_Modality }) {
    this.obs = new ObservabilitySideEffect();
    this.autoInstall = new AutoInstallSideEffect();
    this.core = new KernelCore(modalities, []);
    this.autoRun = new AutoRunSideEffect(this.core);
    this.core.addSideEffect(this.autoRun);
    this.core.addSideEffect(this.obs);
    this.core.addSideEffect(this.autoInstall);

    Object.values(modalities).forEach((m: any) => {
      if (typeof m.connectToKernel === "function") m.connectToKernel(this);
    });

  }

  /* ----- public façade that mimics the old API ----- */
  pushWorkload(w: CK_Workload) {
    this.core.pushWorkload(w);
  }
  step() {
    return this.core.step();
  }

  getRegistry() {
    return this.autoInstall.getRegistry();
  }

  subscribe = (cb: Parameters<ObservabilitySideEffect["subscribe"]>[0]) =>
    this.obs.subscribe(cb);

  getSnapshot = () => this.obs.getSnapshot();

  setEmissionMode = (m: EmissionMode) => {
    this.obs.setMode(m)
    this.autoRun.setMode(m);
  };
}