import CreativeKernel from "../kernel/kernel";
import { CK_InstallUnit, CK_Modality, CK_Unit, CK_WorkerUnit, CK_TerminateUnit } from "../kernel/types";

const generatePw = () => {
    return Math.random().toString(36).substring(2, 15);
}

const MAX_TIMEOUT = 5000;
class IframeModality implements CK_Modality {
    sendMessage(id: string, message: any) {
        
        const iframe = this.instances[id];
        //post message
        //console.log("sendMessage", id, message, iframe);
        if (iframe) {
            iframe.contentWindow?.postMessage({
                type: 'ck-message',
                payload: message
            }, '*');
        }
    }

    kernel: CreativeKernel | null = null;
    connectToKernel(kernel: CreativeKernel) {
        this.kernel = kernel;
    }

    constructor() {
        window.addEventListener('message', (event) => {
            const { data } = event;
            if (data.type === 'ck-message'
                && data.payload.pw
                && data.payload.PUSH_WORKLOAD
            ) {
                const pw = data.payload.pw;
                const instance_id = this.pw_id[pw];
                if (instance_id) {
                    const response = event.data.payload.workload;
                    const responseKeys = Object.keys(response);
                    responseKeys.forEach((key) => {
                        const threadQueue = response[key];
                        threadQueue.forEach((unit: CK_Unit) => {
                            if (unit.type === "worker") {
                                const instance_id = this.pw_id[pw];
                                const resource_id = this.id_resource[instance_id];
                                unit.sender = {
                                    modality: "iframe",
                                    resource_id: resource_id,
                                    instance_id: instance_id,
                                }
                            }
                        });
                    });
                    this.pendingWorkloads.push(response);
                    this.scheduleWorkloadRelease();
                    // const kernel = this.kernel;
                    // if (kernel) {
                    //     kernel.pushWorkload(response);
                    // }
                }
            }
        });
    }

    pendingWorkloads: { [id: string]: CK_WorkerUnit[] }[] = [];
    workloadReleaseScheduled: boolean = false;
    async scheduleWorkloadRelease() {
        if (this.workloadReleaseScheduled) {
            return;
        }
        this.workloadReleaseScheduled = true;
        while (this.pendingWorkloads.length > 0) {
            const workload = this.pendingWorkloads.shift();
            if (workload) {
                const kernel = this.kernel;
                if (kernel) {
                    await kernel.pushWorkload(workload);
                }
            }
        }
        this.workloadReleaseScheduled = false;
    }



    pw_id: { [pw: string]: string } = {};
    id_pw: { [id: string]: string } = {};
    id_resource: { [id: string]: string } = {};
    instances: { [id: string]: HTMLIFrameElement } = {};

    async terminateUnit(unit: CK_TerminateUnit): Promise<boolean> {
        const { instance } = unit;
        const { instance_id } = instance;
        const iframe = this.instances[instance_id];
        if (iframe) {
            iframe.parentNode?.removeChild(iframe);
            delete this.instances[instance_id];
            delete this.pw_id[this.id_pw[instance_id]];
            delete this.id_pw[instance_id];
            delete this.id_resource[instance_id];
        }
        return true;
    }


    async installUnit(unit: CK_InstallUnit): Promise<false | { [key:string] : any }> {
        //console.log("installUnit", unit);
        const { instance } = unit;
        const { instance_id, resource_id } = instance;
        const pw = generatePw();
        this.pw_id[pw] = instance_id;
        this.id_pw[instance_id] = pw;
        this.id_resource[instance_id] = resource_id;
        const iframe = this.instances[instance_id] || document.createElement('iframe');
        this.instances[instance_id] = iframe;
        iframe.onload = (e) => {
            this.sendMessage(instance_id, { CK_INSTALL: true, pw: pw, instanceId: instance_id });        
        }
        const success = await this.initializeIframe(instance_id, resource_id);
        return {};
    }

    async initializeIframe(id: string, src: string) {
        const pw = this.id_pw[id];
        const iframe = this.instances[id];
        const success = await new Promise((resolve) => {
        const listener = (event) => {
            if (event.data.type === 'ck-message'
                && event.data.payload.pw === pw
                && event.data.payload.CK_INSTALL === true
            ) {
                window.removeEventListener('message', listener);
                resolve(true);
            }
        }
        window.addEventListener('message', listener);
        iframe.src = src;
        setTimeout(() => {
            window.removeEventListener('message', listener);
            resolve(false);
        }, MAX_TIMEOUT);
        });
        return success as boolean;

    }


    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {

        const { receiver } = unit;
        const { instance_id } = receiver;

        this.sendMessage(instance_id, { CK_COMPUTE: true, unit: unit });
        // await a return message from the iframe
        const response = await new Promise((resolve) => {
            const listener = (event: MessageEvent) => {
                //////console.log(event.data)
                if (event.data.type === 'ck-message'
                    && event.data.payload.pw === this.id_pw[instance_id]
                    && event.data.payload.CK_COMPUTE === true
                ) {
                    window.removeEventListener('message', listener);
                    const response = event.data.payload.response;
                    //////console.log(response);
                    const responseKeys = Object.keys(response);
                    responseKeys.forEach((key) => {
                        const threadQueue = response[key];
                        threadQueue.forEach((unit: CK_Unit) => {
                            if (unit.type === "worker") {
                                unit.sender = receiver;
                            }
                        });
                    })
                    resolve(response);
                }
            };
            // add a timeout
            setTimeout(() => {
                window.removeEventListener('message', listener);
                resolve(false);
            }, MAX_TIMEOUT);
            window.addEventListener('message', listener);
        });

        if (response !== false) {
            return response as { [threadId: string]: CK_Unit[] };
        }
        throw new Error("Error computing unit");
    }


    setIframe(id: string, address: string, iframe: HTMLIFrameElement) {
        this.instances[id] = iframe;
    }

}

export default IframeModality;