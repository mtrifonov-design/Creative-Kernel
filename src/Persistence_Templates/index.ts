import bb from './BouncingBall.json';
import s from './ForSasha.json'
import cs from './cybspagnew.json'
import ll from './LaserLinguine.json'
import liquidl from './lissajous.json'

const TEMPLATES = {
    "default": JSON.stringify(bb),
    "forsasha": JSON.stringify(s),
    "cyberspaghetti": JSON.stringify(cs),
    "laserlinguine": JSON.stringify(ll),
    "liquidlissajous": JSON.stringify(liquidl),
}

export { TEMPLATES }; 