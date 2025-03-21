const instances : {
    [id: string]: HTMLIFrameElement
} = {};

const pw_id : {
    [pw: string]: string
} = {};

function generatePw() {
    const pw = Math.random().toString(36).substring(2, 15);
    return pw;
};

function install(iframe: HTMLIFrameElement, id: string) {
    const pw = generatePw();
    pw_id[pw] = id;
    instances[id] = iframe;
    iframe.onload = () => {
        sendMessage(id, { MOG_INSTALL: true, pw: pw });
    }

}

function dispose(id: string) {
    const iframe = instances[id];
    if (iframe) {
        iframe.remove();
        delete instances[id];
    }
}

function sendMessage(id: string, message: any) {
    const iframe = instances[id];

    const wrapped = JSON.stringify({
        type: 'mog-message',
        content: message,
    });
    //post message
    if (iframe) {
        iframe.contentWindow?.postMessage(wrapped, '*');
    }
}

window.addEventListener("message", (event: MessageEvent) => {
    const message = JSON.parse(event.data);

    
    if (message.type === 'mog-message') {
        const { target, content, pw } = message.content;
        // console.log(`MESSAGE ${pw_id[pw]} --> ${target}:\n\n${content}`,pw);
        const source = pw_id[pw];
        const e = new CustomEvent("mog-message", {
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