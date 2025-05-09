
import { CoreBackgroundBase } from "../../Config";

class AssetViewer {
    modality;
    constructor(modality) {
        this.modality = modality;
    }

    index: any;
    subscriptionId: string;
    computeUnit(unit) {
        const { payload, sender, receiver } = unit;

        const { subscriptionConfirmation, getAssetResponse, receiveUpdate} = payload;

        if (getAssetResponse) {
            const { asset_data, asset_id } = getAssetResponse;
            this.index = asset_data;
            this.notifySubscribers();
        }

        if (subscriptionConfirmation) {
            const { subscription_id } = subscriptionConfirmation;
            this.subscriptionId = subscription_id;
        }

        if (receiveUpdate) {
            const { update } = receiveUpdate;
            this.index = update;
            this.notifySubscribers();
        }


        return {}
    }

    connect() {
        this.index = undefined;
        this.subscriptionId = undefined;
        this.notifySubscribers();
        this.modality.pushWorkload({
            default: [
                {
                    type: "worker",
                    sender: {
                        instance_id: "asset_viewer",
                        resource_id: "asset_viewer",
                        modality: "privileged",
                    },
                    receiver: {
                        instance_id: "ASSET_SERVER",
                        modality: "wasmjs",
                        resource_id: CoreBackgroundBase+"AssetServerV2",
                    },
                    payload: {
                        subscribeToExistingAsset: {
                            asset_id: "index",
                            subscription_name: crypto.randomUUID(),
                        }
                    }
                    
                }
            ]
        })
    }

    disconnect() {  
        this.modality.pushWorkload({
            default: [
                {
                    type: "worker",
                    sender: {
                        instance_id: "asset_viewer",
                        resource_id: "asset_viewer",
                        modality: "privileged",
                    },
                    receiver: {
                        instance_id: "ASSET_SERVER",
                        modality: "wasmjs",
                        resource_id: CoreBackgroundBase+"AssetServerV2",
                    },
                    payload: {
                        unsubscribeFromAsset: {
                            asset_id: "index",
                            subscription_id: this.subscriptionId,
                        }
                    }
                    
                }
            ]
        })
    }


    subscribers: Function[] = [];
    subscribe(cb) {
        this.subscribers.push(cb);
        return () => {
            this.subscribers = this.subscribers.filter((s) => s !== cb);
        }
    }

    notifySubscribers() {
        this.subscribers.forEach((s) => s());
    }

    getSnapshot() {
        return this.index;
    }
}

export default AssetViewer;