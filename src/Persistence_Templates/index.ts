import bb from './BouncingBall.json';
import s from './ForSasha.json'
import cs from './cybspagh_renewedtemplate.json'
import ll from './LaserLinguine.json'
import liquidl from './liquidlissajousv05.json'
import echoknight from './echoknight_t.json'

const TEMPLATES = {
    "default": JSON.stringify(bb),
    "forsasha": JSON.stringify(s),
    "cyberspaghetti": JSON.stringify(cs),
    "laserlinguine": JSON.stringify(ll),
    "liquidlissajous": JSON.stringify(liquidl),
    "echoknight": JSON.stringify(echoknight),
}

export { TEMPLATES }; 