import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Modality, CK_Unit, CK_WorkerUnit } from "../kernel/types";


class UIModality implements CK_Modality {
    kernel: CreativeKernel | null = null;
    connectToKernel(kernel: CreativeKernel) {
        this.kernel = kernel;
    }

    async installUnit(unit: CK_InstallUnit): Promise<boolean> {
        return true;
    }
    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {

        const { receiver } = unit;
        const { instance_id } = receiver;
        
        
    
    
    }

}

export default UIModality;