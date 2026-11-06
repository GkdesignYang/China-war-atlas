// 汇总史料，供构建脚本使用
const { T } = require('./time.js');
const { S, K } = require('./stages.js');
const EV = require('./events.js').map(e => [T(e[0]), e[1], e[2], e[3], e[4], e[5], e[6] || '', e[0]]).sort((a, b) => a[0] - b[0]);
const CI = require('./cities.js');
const PE = require('./people.js').map(p => ({ ...p, stops: p.stops.map(s => [T(s[0]), s[1], s[2], s[3], s[4], s[5] || '', s[0]]) }));
const RUL = require('./rulers.js');
const { FO, AR, PA, QZ, C } = require('./forces.js');
const evTitles = new Set(EV.map(e => e[3])); QZ.forEach(q => { if (!evTitles.has(q)) console.warn('quiz event missing:', q); });
const ov = (a, b, s) => T(a) < s.b && T(b) > s.a;
S.forEach(s => { s.fo = FO.filter(f => ov(f[0], f[1], s)).map(f => [f[2], C[f[3]], f[4], f[5], f[6], f[7], f[8], f[9]]); s.ar = AR.filter(a => ov(a[0], a[1], s)).map(a => [C[a[2]], a[3], a[4]]); });
const GROUP = [[T('1839-03-10'), T('1851-01-11'), '鸦片战争', '#c49a4a'], [T('1851-01-11'), T('1878-01-01'), '太平天国·西北', '#c0705a'], [T('1878-01-01'), T('1894-07-25'), '洋务·中法', '#8fa36a'], [T('1894-07-25'), T('1911-10-10'), '甲午·庚子·日俄', '#9a6b4a'], [T('1911-10-10'), T('1926-07-09'), '民初·军阀', '#6f97b8'], [T('1926-07-09'), T('1937-07-07'), '北伐·十年内战', '#5a7fb0'], [T('1937-07-07'), T('1945-08-15'), '抗日战争', '#a07850'], [T('1945-08-15'), T('1950-06-25'), '解放战争', '#c0504a'], [T('1950-06-25'), T('1953-07-27'), '抗美援朝', '#b0605a'], [T('1953-07-27'), T('1980-01-01'), '冷战边疆', '#7a8aa8']];
module.exports = { S, K, EV, CI, PE, out: () => ({ S: S.map(s => ({ a: s.a, b: s.b, sn: s.sn, era: s.era, note: s.note, at: s.at, pol: s.pol.map(p => ({ n: p.n, k: p.k, lab: p.lab, small: p.small })), fo: s.fo, ar: s.ar })), EV, CI, PE, RU: RUL.RU, ERA_CN: RUL.ERA_CN, ERA_JP: RUL.ERA_JP, PA, QZ, G: GROUP }) };
