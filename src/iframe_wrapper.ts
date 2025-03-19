const instances : {
    [id: string]: HTMLIFrameElement
} = {};

function install(iframe: HTMLIFrameElement, id: string) {
    instances[id] = iframe;
}

function dispose(id: string) {
    const iframe = instances[id];
    if (iframe) {
        iframe.remove();
        delete instances[id];
    }
}

function sendMessage(id: string, message: string) {
    const iframe = instances[id];

    const wrapped = JSON.stringify({
        type: 'wasm-message',
        content: message,
    });
    //post message
    if (iframe) {
        iframe.contentWindow?.postMessage(wrapped, '*');
    }
}

window.addEventListener("message", (event: MessageEvent) => {
    const message = event.data;
    if (message.type === 'wasm-message') {
        const { target, content, source } = JSON.parse(message.content);

        const e = new CustomEvent("wasm-message", {
            detail: {
                source,
                target,
                content
            },
        });
        window.dispatchEvent(e);
    }
});

export { install, sendMessage, dispose };