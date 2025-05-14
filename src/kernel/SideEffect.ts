import { CK_Unit, CK_Workload } from './types';

export interface SideEffect {

  processReceivedWorkload(workload: CK_Workload): CK_Workload;
  processReceivedDelta(delta: CK_Workload): CK_Workload;


  updateGlobalState(plate: CK_Workload, pending: CK_Workload[]): void;


  workloadComplete(): void;

  workloadWasPushed(): void;


  stepComplete(processedUnit : CK_Unit): void;
}