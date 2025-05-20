import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CreativeKernel from "../kernel/CreativeKernel";
import DefaultModality from "./DefaultModality";
import { CK_WorkerUnit, CK_Workload } from '../kernel/types';
import CK_Debugger from '../CK_Debugger/CK_Debugger';


class SimpleInstance {
  pushWorkload: (w: CK_Workload) => void;
  instanceId: string;
  constructor(instanceId: string, pushWorkload: (w: CK_Workload) => void) {
    this.pushWorkload = pushWorkload;
    this.instanceId = instanceId;
  }
  async computeUnit(unit: CK_WorkerUnit) {
    console.log(`I'm ${this.instanceId}! Received unit:`, unit);
    return {};
  }
}

function main() {

  // Instantiate the kernel and the default modality.
  const defaultModality = new DefaultModality();
  const kernel = new CreativeKernel({
    defaultModality,
  },);
  kernel.setEmissionMode("STEP"); // <- this means the kernel will not auto-run the workload, you can step through it in the debugger.

  // Add the Debug Console to the DOM.
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <div style={{
        backgroundColor: "gray",
        width: "100vw",
        height: "100vh",
        display: "grid",
        gridTemplateRows: "50% 50%",
      }}>
        <div>
          There is no UI to see here.
        </div>
        <CK_Debugger kernel={kernel} />
      </div>
    </StrictMode>
  )

  // Connect an "instance factory" to the default modality.
  // This factory will be called when someone wants to create an instance of the type "SimpleInstance".
  defaultModality.addInstanceFactory("SimpleInstance", async (instanceId: string, pushWorkload: (w: CK_Workload) => void) => {
    return {
      instance: new SimpleInstance(instanceId, pushWorkload),
      metadata: { description: "Some metadata that is useful to the kernel" }
    };
  })


    kernel.pushWorkload({
      default: [
        {
          type: "worker",
          receiver: {
            resource_id: "SimpleInstance",
            instance_id: "SimpleInstance_1",
            modality: "defaultModality",
          },
          sender: {
            resource_id: "Kernel",
            instance_id: "Kernel",
            modality: "Unimportant",
          },
          payload: {
            data: "Hello world!",
          },
          id: crypto.randomUUID(),
        }
      ]
    })

}

export default main;