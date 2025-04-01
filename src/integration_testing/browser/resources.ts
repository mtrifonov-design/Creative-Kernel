
class ResourceA {
    constructor() {
        const div = document.createElement('div');
        div.innerHTML = `
        <div style="border: 1px solid black">
        
            <h2>Chat partner 1</h2>
            <input type="textarea" id="input1" placeholder="Enter text here...">
            <button id="resourceASend">Send</button>
            <div id="resourceAChat"></div>
        </div>
        `;
        document.getElementById("MAIN")!.appendChild(div);
    }
}



export { ResourceA };