import { KernelCore } from "../kernel/KernelCore";
// import CreativeKernel from "../kernel/KernelOBSOLETE";
import { CK_InstallUnit, CK_Modality, CK_Unit, CK_WorkerUnit, CK_TerminateUnit, CK_Workload } from "../kernel/types";


const generatePw = () => {
    return Math.random().toString(36).substring(2, 15);
}

const MAX_TIMEOUT = 15000;
class IframeModality implements CK_Modality {
    sendMessage(id: string, message: any) {

        const iframe = this.instances[id];
        //post message
        ////console.log("sendMessage", id, message, iframe);
        if (iframe) {
            iframe.contentWindow?.postMessage({
                type: 'ck-message',
                payload: message
            }, '*');
        }
    }

    kernel: KernelCore | null = null;
    connectToKernel(kernel: KernelCore) {
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
                    const metadata = event.data.payload.metadata || {};
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
                                if (unit.payload.TO_SELF) {
                                    unit.receiver = {
                                        modality: "iframe",
                                        resource_id: resource_id,
                                        instance_id: instance_id,
                                    }
                                }
                            }
                        });
                    });
                    this.kernel?.pushWorkload(response, metadata);
                    // this.pendingWorkloads.push({workload:response, metadata: metadata});
                    // this.scheduleWorkloadRelease();
                    // const kernel = this.kernel;
                    // if (kernel) {
                    //     kernel.pushWorkload(response);
                    // }
                }
            }
        });
    }

    pendingWorkloads: { workload: CK_Workload, metadata?: { [key: string]: any } }[] = [];
    workloadReleaseScheduled: boolean = false;
    async scheduleWorkloadRelease() {
        if (this.workloadReleaseScheduled) {
            return;
        }
        this.workloadReleaseScheduled = true;
        while (this.pendingWorkloads.length > 0) {
            const nextWorkload = this.pendingWorkloads[0];
            if (nextWorkload) {
                const kernel = this.kernel;
                if (kernel) {
                    const { workload, metadata } = nextWorkload;
                    kernel.pushWorkload(workload, metadata);
                    this.pendingWorkloads.shift();
                }
            }
        }
        this.workloadReleaseScheduled = false;
    }



    pw_id: { [pw: string]: string } = {};
    id_pw: { [id: string]: string } = {};
    id_resource: { [id: string]: string } = {};
    id_installed: { [id: string]: boolean } = {};
    instances: { [id: string]: HTMLIFrameElement } = {};

    async terminateUnit(unit: CK_TerminateUnit): Promise<boolean> {
        const { instance } = unit;
        const { instance_id } = instance;
        const iframe = this.instances[instance_id];
        if (iframe) {
            if (iframe.classList.contains("hidden_iframe")) iframe.parentNode?.removeChild(iframe);
            delete this.instances[instance_id];
            delete this.pw_id[this.id_pw[instance_id]];
            delete this.id_pw[instance_id];
            delete this.id_resource[instance_id];
            delete this.id_installed[instance_id];
        }
        return true;
    }


    async installUnit(unit: CK_InstallUnit): Promise<false | { [key: string]: any }> {
        console.log("installUnit", unit);
        const { instance } = unit;
        const { instance_id, resource_id } = instance;
        const pw = generatePw();
        this.pw_id[pw] = instance_id;
        this.id_pw[instance_id] = pw;
        this.id_resource[instance_id] = resource_id;
        // //console.log(this.instances[instance_id])

        const iframe = this.instances[instance_id] || document.createElement('iframe');


        this.instances[instance_id] = iframe;
        iframe.onload = (e) => {
            this.id_installed[instance_id] = true;
            this.sendMessage(instance_id, { CK_INSTALL: true, pw: pw, instanceId: instance_id, resourceId: resource_id });
        }
        if (!iframe.isConnected) {
            iframe.style.display = "none";
            iframe.style.width = "0px";
            iframe.style.height = "0px";
            iframe.style.border = "none";
            iframe.style.position = "absolute";
            iframe.style.zIndex = "-1";
            iframe.style.pointerEvents = "none";
            iframe.classList.add("hidden_iframe");
            document.body.appendChild(iframe);
        }
        const metadata = await this.initializeIframe(instance_id, resource_id);
        return metadata;
    }

    async initializeIframe(id: string, src: string) {
        const pw = this.id_pw[id];
        const iframe = this.instances[id];
        const metadata = await new Promise((resolve) => {
            const listener = (event) => {
                if (event.data.type === 'ck-message'
                    && event.data.payload.pw === pw
                    && event.data.payload.CK_INSTALL === true
                ) {
                    window.removeEventListener('message', listener);
                    resolve(event.data.payload.metadata);
                }
            }
            window.addEventListener('message', listener);
            iframe.src = src;
            setTimeout(() => {
                window.removeEventListener('message', listener);
                resolve(false);
            }, MAX_TIMEOUT);
        });
        return metadata as any;
    }


    async computeUnit(unit: CK_WorkerUnit): Promise<{ [threadId: string]: CK_Unit[] }> {

        const { receiver } = unit;
        const { instance_id } = receiver;

        console.log("Computing unit in iframe modality", instance_id, receiver, unit);
        if (!this.id_installed[instance_id]) {
            console.log("Instance not found, installing...", instance_id, receiver);
            const u = {
                type: "install",
                instance: receiver,
                id: crypto.randomUUID(),
            }
            const meta = await this.installUnit(u as CK_InstallUnit);
            this.kernel?.registerInstalledInstance({ modality: "iframe", resource_id: u.instance.resource_id, instance_id: u.instance.instance_id }, meta);
            console.log("Meta,", meta)
        }

        this.sendMessage(instance_id, { CK_COMPUTE: true, unit: unit });
        // await a return message from the iframe
        const response = await new Promise((resolve) => {
            const listener = (event: MessageEvent) => {
                if (event.data.type === 'ck-message'
                    && event.data.payload.pw === this.id_pw[instance_id]
                    && event.data.payload.CK_COMPUTE === true
                ) {
                    window.removeEventListener('message', listener);
                    const response = event.data.payload.response;
                    const responseKeys = Object.keys(response);
                    responseKeys.forEach((key) => {
                        const threadQueue = response[key];
                        threadQueue.forEach((unit: CK_Unit) => {
                            if (unit.type === "worker") {
                                unit.sender = receiver;
                                if (unit.payload.TO_SELF) {
                                    unit.receiver = receiver;
                                }

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
        //console.log(response);

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