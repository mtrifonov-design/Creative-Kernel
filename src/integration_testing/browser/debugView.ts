function init() {

    const style = document.createElement('style');
    style.innerHTML = `
        #CK_DEBUG_VIEW {
            display: flex;
            font-family: Arial, sans-serif;
            padding: 10px;
            background-color: #ddd;
            position: fixed;
            bottom:0;
            width: 100%;
            height: 300px;
            left: 0;
        }
        #threadsView {
            flex: 3;
            padding: 10px;
        }
        #unitInspector {
            flex: 1;
            border-left: 2px solid #555;
            padding: 10px;
        }
        .thread {
            background: #ccc;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 5px;
        }
        .units {
            display: flex;
            gap: 10px;
        }
        .unit {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid transparent;
        }
        .worker { background: lightblue; }
        .install { background: lightcoral; }
        .blocker { background: black; }

        .selected {
            border: 2px solid #000;
        }
        button {
            margin-top: 10px;
        }

    `;
    document.head.appendChild(style);

    const element = document.createElement("div");
    element.id = "CK_DEBUG_VIEW";
    element.style.position = "fixed";
    element.style.bottom = "0";
    element.style.left = "0";

    element.innerHTML = `
    <div id="threadsView"></div>
        <div id="unitInspector">
        <h3>UNIT INSPECTOR</h3>
        <div id="unitDetails">Select a unit.</div>
    </div>
    `

    document.body.appendChild(element);
}



function renderThreads(kernel) {
    const threads = kernel.getThreads();
    //console.log(threads);
    const threadsView = document.getElementById('threadsView');
    threadsView.innerHTML = '';

    Object.entries(threads).forEach(([threadId, units]) => {
        const threadDiv = document.createElement('div');
        threadDiv.className = 'thread';
        threadDiv.innerHTML = `<strong>${threadId}</strong>`;

        const unitsContainer = document.createElement('div');
        unitsContainer.className = 'units';

        units.forEach((unit, idx) => {
            const unitDiv = document.createElement('div');
            unitDiv.className = `unit ${unit.type}`;
            unitDiv.onclick = () => selectUnit(unit, threadId, idx, kernel, unitDiv);
            unitsContainer.appendChild(unitDiv);
        });

        threadDiv.appendChild(unitsContainer);
        threadsView.appendChild(threadDiv);
    });
}


let selectedUnitElement = null;
function selectUnit(unit, threadId, unitIdx, kernel, unitElement) {
    if (selectedUnitElement) {
        selectedUnitElement.classList.remove('selected');
    }
    unitElement.classList.add('selected');
    selectedUnitElement = unitElement;

    const details = document.getElementById('unitDetails');
    details.innerHTML = `<pre>${JSON.stringify(unit, null, 2)}</pre>`;

    const inspector = document.getElementById('unitInspector');
    const existingButton = inspector.querySelector('button');
    if (existingButton) existingButton.remove();

    if (unit.type === 'install') {
        const button = document.createElement('button');
        button.textContent = 'INSTALL';
        button.onclick = () => {
            kernel.installUnit(threadId, unitIdx).then(() => {

                renderThreads(kernel);
                details.innerHTML = 'Unit installed successfully.';

            }).catch((error) => {
                console.error(error);
                details.innerHTML = 'Error installing unit.';
            });

        };
        inspector.appendChild(button);
    } else if (unit.type === 'worker' && kernel.checkIfUnitReady(threadId, unitIdx)) {
        const button = document.createElement('button');
        button.textContent = 'COMPUTE';
        button.onclick = () => {
            kernel.computeUnit(threadId, unitIdx);
            renderThreads(kernel);
            details.innerHTML = 'Unit computed successfully.';
        };
        inspector.appendChild(button);
    }
}

init();

export { renderThreads };