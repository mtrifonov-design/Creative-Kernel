import { CK_Instance, CK_Unit, CK_Workload } from './types';

export interface SideEffect {

  processReceivedWorkload?(workload: CK_Workload): CK_Workload;
  processReceivedDelta?(delta: CK_Workload): CK_Workload;
  updateGlobalState?(plate: CK_Workload, pending: CK_Workload[]): void;
  workloadComplete?(): void;
  workloadWasPushed?(workload: CK_Workload, metadata? :{ [key:string]:unknown}): void;
  pushWorkloadComplete?(workload: CK_Workload): void;
  stepComplete?(processedUnit : CK_Unit): void;
  instanceInstalled?(unit: CK_Instance, metadata: unknown): void;
  instanceTerminated?(unit: CK_Instance): void; 

}