import bb from './BouncingBall.json';
import s from './ForSasha.json'
import cs from './CybSpag.json'
import ll from './LaserLinguine.json'

const TEMPLATES = {
    "default": JSON.stringify(bb),
    "forsasha": JSON.stringify(s),
    "cyberspaghetti": JSON.stringify(cs),
    "laserlinguine": JSON.stringify(ll),
}

export { TEMPLATES }; 