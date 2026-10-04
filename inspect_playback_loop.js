const fs = require('fs');

const code = fs.readFileSync('runtime/assets/preset-DRWJZI25.js', 'utf8');

const iifeEnd = code.indexOf('(_0x2610,0x1a413));') + '(_0x2610,0x1a413));'.length;
const iifeCode = code.slice(0, iifeEnd);
const startArr = code.indexOf('function _0x2610()');
let depth = 0, endArr = startArr, foundFirstBrace = false;
for (let i = startArr; i < code.length; i++) {
    if (code[i] === '{') { depth++; foundFirstBrace = true; }
    else if (code[i] === '}') { depth--; if (foundFirstBrace && depth === 0) { endArr = i + 1; break; } }
}
const arrCode = code.slice(startArr, endArr);
const startDec = code.indexOf('function _0x449c(');
depth = 0; let endDec = startDec; foundFirstBrace = false;
for (let i = startDec; i < code.length; i++) {
    if (code[i] === '{') { depth++; foundFirstBrace = true; }
    else if (code[i] === '}') { depth--; if (foundFirstBrace && depth === 0) { endDec = i + 1; break; } }
}
const decCode = code.slice(startDec, endDec);

eval(arrCode);
eval(decCode);
eval(iifeCode);

const wrapperRegex = /function (_0x[a-f0-9]+)\((_0x[a-f0-9]+),(_0x[a-f0-9]+)\)\{return (_0x[a-f0-9]+)\(([^)]+)\);\}/g;
let wm;
const fnWrappers = new Map();
while ((wm = wrapperRegex.exec(code)) !== null) {
    fnWrappers.set(wm[1], { p1: wm[2], p2: wm[3], target: wm[4], body: wm[5] });
}

function resolveValue(fnName, arg1, arg2) {
    try {
        if (fnName === '_0x449c') return _0x449c(arg1, arg2);
        const w = fnWrappers.get(fnName);
        if (!w) return null;
        let expr = w.body;
        expr = expr.replace(new RegExp('\\b' + w.p1 + '\\b', 'g'), '(' + arg1 + ')');
        expr = expr.replace(new RegExp('\\b' + w.p2 + '\\b', 'g'), '(' + JSON.stringify(arg2) + ')');
        const parts = expr.split(',');
        const a1 = eval(parts[0]);
        const a2 = eval(parts[1]);
        if (w.target === '_0x449c') return _0x449c(a1, a2);
        return resolveValue(w.target, a1, a2);
    } catch {
        return null;
    }
}

let deob = code.replace(/(_0x[a-f0-9]+)\((0x[a-f0-9]+|-0x[a-f0-9]+|\d+),\s*(0x[a-f0-9]+|-0x[a-f0-9]+|\d+|'[^']*'|"[^"]*")\)/g, function(match, fn, a1Str, a2Str) {
    try {
        const a1 = eval(a1Str);
        let a2;
        try { a2 = eval(a2Str); } catch { a2 = a2Str; }
        const val = resolveValue(fn, a1, a2);
        if (typeof val === 'string') {
            return JSON.stringify(val);
        }
    } catch {}
    return match;
});

const terms = ['"play"', 'requestAnimationFrame', 'performance.now', 'is-playing', 'Xe()', 'playAudio', 'sound'];
for (const term of terms) {
    let idx = 0;
    console.log(`\n================== TERM: ${term} ==================`);
    let count = 0;
    while ((idx = deob.indexOf(term, idx)) !== -1 && count < 3) {
        const start = Math.max(0, idx - 150);
        const end = Math.min(deob.length, idx + 350);
        console.log(`[At ${idx}]:`);
        console.log(deob.slice(start, end));
        idx += term.length;
        count++;
    }
}
