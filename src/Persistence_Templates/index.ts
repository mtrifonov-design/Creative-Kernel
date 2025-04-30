import bb from './BouncingBall.json';
import s from './ForSasha.json'
import cs from './CybSpag.json'

const TEMPLATES = {
    "default": JSON.stringify(bb),
    "forsasha": JSON.stringify(s),
    "cyberspaghetti": JSON.stringify(cs),
}

export { TEMPLATES }; 