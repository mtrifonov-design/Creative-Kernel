const production = false;
const CorePluginBase = production ? "https://mtrifonov-design.github.io/pinsandcurves-panels/#" : "http://localhost:5174/#";
const CoreBackgroundBase = production ? "https://mtrifonov-design.github.io/pinsandcurves-background-services/" : "http://localhost:8000/";

const mock = false;
const debug = true;

export {
    CorePluginBase,
    CoreBackgroundBase,
    mock,
    debug,
    production,
}