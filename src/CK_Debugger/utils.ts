export const getSnapshot = () => {
    return window.CREATIVE_KERNEL.getSnapshot();
};

export const subscribe = (callback: () => void) => {
    return window.CREATIVE_KERNEL.subscribe(callback);
};
