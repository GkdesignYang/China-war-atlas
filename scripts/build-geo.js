// 近代战争舆图：底图与各时期政权轮廓
// 输入：raw/（Natural Earth 省级行政区、河流、湖泊、地理区域）、data/*.js
// 输出：build/geo.json（几何，0.01° 增量编码）、build/data.json（史料）
const fs = require('fs'), path = require('path');
const R = p => path.join(__dirname, '..', p);
fs.mkdirSync(R('build'), { recursive: true });
const tc = require(R('node_modules/topojson-client')), ts = require(R('node_modules/topojson-simplify')), tsv = require(R('node_modules/topojson-server'));
const pc = require(R('node_modules/polygon-clipping'));
const BB = [68, -13, 205, 56];
const BOX = [[[BB[0], BB[1]], [BB[2], BB[1]], [BB[2], BB[3]], [BB[0], BB[3]], [BB[0], BB[1]]]];
// ---------- 编码 ----------
function encRing(r) { let s = '', px = 0, py = 0, n = 0;
  const put = v => { v = v < 0 ? ~(v << 1) : (v << 1); while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } s += String.fromCharCode(v + 63); };
  for (const p of r) { const x = Math.round(p[0] * 100), y = Math.round(p[1] * 100); if (n && x === px && y === py) continue; put(x - px); put(y - py); px = x; py = y; n++; } return s; }
const encMP = mp => mp.map(poly => poly.map(encRing).join(',')).join(';');
function dp(pts, eps) { if (pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) { const d = L < 1e-8 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > md) { md = d; mi = i; } }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); } } return pts.filter((_, i) => keep[i]); }
const ringArea = r => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a / 2; };
function cleanMP(mp, minA, eps) { const out = []; for (const poly of mp) { const rings = []; poly.forEach((r, i) => { if (Math.abs(ringArea(r)) < (i ? minA * 2 : minA)) return; const s = eps ? dp(r, eps) : r; if (s.length < 4) return; rings.push(s); }); if (rings.length && Math.abs(ringArea(poly[0])) >= minA) out.push(rings); } return out; }
const chaikin = (ring, it) => { let r = ring.slice(); if (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) r.push(r[0]);
  for (let k = 0; k < it; k++) { const o = []; for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } o.push(o[0]); r = o; } return r; };
const shiftG = g => { const w = a => typeof a[0] === 'number' ? (a[0] < -100 ? [a[0] + 360, a[1]] : a) : a.map(w); return { type: g.type, coordinates: w(g.coordinates) }; };
const nums = g => { const o = []; (function w(a) { if (typeof a[0] === 'number') o.push(a[0], a[1]); else if (a) a.forEach(w); })(g ? g.coordinates : []); return o; };
// ---------- 省级行政区 → 拓扑简化 ----------
const CODE = { CN: 'China', TW: 'Taiwan', HK: 'Hong Kong S.A.R.', MO: 'Macau S.A.R', KP: 'North Korea', KR: 'South Korea', JP: 'Japan', MN: 'Mongolia', RU: 'Russia', VN: 'Vietnam', LA: 'Laos', KH: 'Cambodia', TH: 'Thailand', MM: 'Myanmar', MY: 'Malaysia', SG: 'Singapore', BN: 'Brunei', ID: 'Indonesia', PH: 'Philippines', TL: 'East Timor', PG: 'Papua New Guinea', SB: 'Solomon Islands', IN: 'India', NP: 'Nepal', BT: 'Bhutan', BD: 'Bangladesh', PK: 'Pakistan', AF: 'Afghanistan', KZ: 'Kazakhstan', KG: 'Kyrgyzstan', TJ: 'Tajikistan', UZ: 'Uzbekistan', AU: 'Australia', US: 'United States of America', UM: 'United States Minor Outlying Islands', GU: 'Guam', MP: 'Northern Mariana Islands', PW: 'Palau', FM: 'Federated States of Micronesia', MH: 'Marshall Islands', KI: 'Kiribati', NR: 'Nauru', LK: 'Sri Lanka', SC: 'Siachen Glacier', SP: 'Spratly Is.' };
const ADM = {}; for (const k in CODE) ADM[CODE[k]] = k;
const src = JSON.parse(fs.readFileSync(R('raw/ne_10m_admin_1_states_provinces.geojson')));
const feats = [];
for (const f of src.features) { const a = ADM[f.properties.admin]; if (!a || !f.geometry) continue; const g = shiftG(f.geometry); const c = nums(g); let ok = false;
  for (let i = 0; i < c.length; i += 2) if (c[i] > BB[0] - 3 && c[i] < BB[2] + 3 && c[i + 1] > BB[1] - 3 && c[i + 1] < BB[3] + 3) { ok = true; break; }
  if (ok) feats.push({ type: 'Feature', properties: { k: a + '.' + f.properties.name, zh: f.properties.name_zh }, geometry: g }); }
let topo = tsv.topology({ a: { type: 'FeatureCollection', features: feats } }, 1e6);
topo = ts.presimplify(topo); topo = ts.simplify(topo, 5e-5);
const geoms = topo.objects.a.geometries;
const U = {}, CC = {}; // 省 → 多边形；国家 → 省列表
geoms.forEach(g => { const k = g.properties.k; const f = tc.feature(topo, g); if (!f.geometry) return; const mp = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let cl; try { cl = pc.intersection(mp, BOX); } catch (e) { return; } cl = cleanMP(cl, 0.00001, 0); if (!cl.length) return;
  U[k] = cl; const c = k.split('.')[0]; (CC[c] = CC[c] || []).push(g); });
const CG = {}; for (const c in CC) { const m = tc.merge(topo, CC[c]); let cl = pc.intersection(m.coordinates, BOX); CG[c] = cleanMP(cl, 0.0003, 0); }
let land = tc.merge(topo, geoms); land = cleanMP(pc.intersection(land.coordinates, BOX), 0.0003, 0);
let pts = 0; land.forEach(p => p.forEach(r => pts += r.length)); console.log('units', Object.keys(U).length, 'countries', Object.keys(CG).length, 'land pts', pts);
// 现代国界（国与国之间）与中国省界
const meshC = tc.mesh(topo, topo.objects.a, (a, b) => a !== b && a.properties.k.split('.')[0] !== b.properties.k.split('.')[0]);
const meshP = tc.mesh(topo, topo.objects.a, (a, b) => a !== b && a.properties.k.startsWith('CN.') && b.properties.k.startsWith('CN.'));
const clipLines = mesh => { const out = []; for (const line of mesh.coordinates) { let cur = []; for (const p of line) { const ok = p[0] >= BB[0] - .5 && p[0] <= BB[2] + .5 && p[1] >= BB[1] - .5 && p[1] <= BB[3] + .5; if (ok) cur.push(p); else { if (cur.length > 1) out.push(cur); cur = []; } } if (cur.length > 1) out.push(cur); } return out.map(b => encRing(dp(b, 0.008))).join(','); };
// ---------- 河流 ----------
const RZH = { 'Yangtze': '长江', 'Huang': '黄河', 'Yellow': '黄河', 'Amur': '黑龙江', 'Sungari': '松花江', 'Songhua': '松花江', 'Ussuri': '乌苏里江', 'Liao': '辽河', 'Xiliao': '西辽河', 'Yalu': '鸭绿江', 'Tumen': '图们江', 'Huai': '淮河', 'Han': '汉江', 'Mekong': '湄公河', 'Lancang': '澜沧江', 'Red': '红河', 'Salween': '萨尔温江', 'Nu': '怒江', 'Irrawaddy': '伊洛瓦底江', 'Brahmaputra': '布拉马普特拉河', 'Dihang': '雅鲁藏布江', 'Ganges': '恒河', 'Indus': '印度河', 'Xi': '西江', 'Pearl': '珠江', 'Gan': '赣江', 'Xiang': '湘江', 'Yuan': '沅江', 'Min': '岷江', 'Dadu': '大渡河', 'Jinsha': '金沙江', 'Tongtian': '通天河', 'Wei': '渭河', 'Fen': '汾河', 'Nen': '嫩江', 'Ergun': '额尔古纳河', 'Hailar': '海拉尔河', 'Selenga': '色楞格河', 'Tarim': '塔里木河', 'Ili': '伊犁河', 'Hongshui': '红水河', 'Xun': '浔江', 'Qiantang': '钱塘江', 'Taedong': '大同江', 'Naktong': '洛东江', 'Imjin': '临津江', 'Chongchon': '清川江', 'Wujiang': '乌江', 'Jialing': '嘉陵江', 'Yongding': '永定河', 'Hai': '海河', 'Zhang': '漳河', 'Fuchun': '富春江', 'Chindwin': '亲敦江', 'Nmai': '恩梅开江', 'Shweli': '瑞丽江', 'Black': '沱江（黑水河）', 'Da': '沱江（黑水河）', 'Nanpan': '南盘江', 'Hun': '浑河', 'Mudan': '牡丹江' };
const rv = JSON.parse(fs.readFileSync(R('raw/ne_10m_rivers_lake_centerlines.geojson')));
const rivers = []; const named = new Set();
for (const f of rv.features) { const pr = f.properties; if (!f.geometry || (pr.featurecla && !/River/.test(pr.featurecla)) || pr.scalerank > 8) continue;
  const g = shiftG(f.geometry); const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
  for (const l of lines) { let cur = []; const segs = []; for (const p of l) { const ok = p[0] >= BB[0] && p[0] <= BB[2] && p[1] >= BB[1] && p[1] <= BB[3]; if (ok) cur.push(p); else { if (cur.length > 1) segs.push(cur); cur = []; } } if (cur.length > 1) segs.push(cur);
    for (const s of segs) { const d = dp(s, 0.015); if (d.length < 2) continue; let len = 0; for (let i = 1; i < d.length; i++) len += Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]); if (len < .3 && pr.scalerank > 5) continue;
      const nm = (pr.name_en || pr.name || '').replace(/\s+/g, ' ').replace(/ (River|Jiang|He|Gang)$/, ''); const zh = RZH[nm] || ''; if (zh) named.add(zh);
      rivers.push({ r: pr.scalerank, n: zh, d: encRing(d), len: +len.toFixed(2) }); } } }
console.log('rivers', rivers.length, [...named].join(' '));
const lk = JSON.parse(fs.readFileSync(R('raw/ne_10m_lakes.geojson')));
const LZ = { '青海湖': '青海湖', '鄱阳湖': '鄱阳湖', '洞庭湖': '洞庭湖', '太湖': '太湖', '洪泽湖': '洪泽湖', '巢湖': '巢湖', '兴凯湖': '兴凯湖', '贝加尔湖': '贝加尔湖', '呼伦湖': '呼伦湖', '巴尔喀什湖': '巴尔喀什湖', '洞里萨湖': '洞里萨湖', '滇池': '滇池', '纳木错': '纳木错', '色林错': '色林错', '库苏古尔湖': '库苏古尔湖', '博斯腾湖': '博斯腾湖', '琵琶湖': '琵琶湖', '微山湖': '微山湖', '鏡泊湖': '镜泊湖' };
const lakes = [];
for (const f of lk.features) { const pr = f.properties; if (pr.scalerank > 7 || !f.geometry) continue; const g = shiftG(f.geometry); let mp = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  // 跨 -100° 经线的湖（加拿大温尼伯湖一带）平移后会横跨整幅地图、形成横条，剔除
  mp = mp.filter(p => { let a = 1e9, b = -1e9; p[0].forEach(q => { if (q[0] < a) a = q[0]; if (q[0] > b) b = q[0]; }); return b - a < 30; }); if (!mp.length) continue;
  let cl; try { cl = pc.intersection(mp, BOX); } catch (e) { continue; } cl = cleanMP(cl, 0.004, 0.01); if (!cl.length) continue; lakes.push({ n: LZ[pr.name_zh] || '', d: encMP(cl) }); }
console.log('lakes', lakes.length, lakes.filter(l => l.n).map(l => l.n).join(' '));
// ---------- 山川 ----------
const RW = { 'HIMALAYAS': ['喜马拉雅山脉', 1], 'TIAN SHAN': ['天山', 1], 'PLATEAU OF TIBET': ['青藏高原', 1, 89, 33.2], 'GOBI DESERT': ['戈壁', 1], 'NORTH CHINA PLAIN': ['华北平原', 2, 116.3, 36.4], 'MANCHURIAN PLAIN': ['东北平原', 2, 125, 45], 'MONGOLIAN PLATEAU': ['蒙古高原', 2], 'KUNLUN MOUNTAINS': ['昆仑山脉', 2], 'GREATER KHINGAN RANGE': ['大兴安岭', 2], 'KARAKORAM RA.': ['喀喇昆仑山', 2], 'PAMIRS': ['帕米尔高原', 3], 'ALTAY MOUNTAINS': ['阿尔泰山', 2], 'CHAÎNE ANNAMITIQUE': ['长山山脉', 2], 'TAKLIMAKAN DESERT': ['塔克拉玛干沙漠', 2], 'TARIM BASIN': ['塔里木盆地', 3], 'SICHUAN BASIN': ['四川盆地', 2], 'YUNGUI PLATEAU': ['云贵高原', 2], 'Loess Plateau': ['黄土高原', 2], 'QUILIAN MOUNTAINS': ['祁连山', 3], 'Lesser Khingan Range': ['小兴安岭', 3], 'SIKHOTE-ALIN’ RANGE': ['锡霍特山脉', 3], 'Dabie Mts.': ['大别山', 3], 'Nan Ling Mts.': ['南岭', 3], 'Wuyi Mts.': ['武夷山', 3], 'Taihang Mts.': ['太行山', 2, 113.6, 37.2], 'Lüliang Mts.': ['吕梁山', 3], 'Qinling Mountains': ['秦岭', 2], 'Yin Mts.': ['阴山', 3], 'Hamgyong Mts.': ['咸镜山脉', 3], 'Dalou Mts.': ['大娄山', 3], 'Junggar Basin': ['准噶尔盆地', 3], 'Qaidam Basin': ['柴达木盆地', 3], 'Mu Us Desert': ['毛乌素沙地', 4], 'Naga Hills': ['那加山', 4], 'Arakan Yoma': ['若开山脉', 4], 'SHAN PLATEAU': ['掸邦高原', 3], 'Khorat Plat.': ['呵叻高原', 3], 'Central Highlands': ['西原', 4], 'NEW GUINEA HIGHLANDS': ['新几内亚高地', 3], 'HINDU KUSH': ['兴都库什山', 3], 'GANGES PLAIN': ['恒河平原', 3], 'Chin Hills': ['钦山', 4], 'ALTUN MTS.': ['阿尔金山', 3], 'Hengduan Shan': ['横断山脉', 2], 'Changbai Shan': ['长白山', 3] };
const rg = JSON.parse(fs.readFileSync(R('raw/ne_10m_geography_regions_polys.geojson'))); const regions = [];
for (const f of rg.features) { const pr = f.properties; const W = RW[pr.NAME.replace(/\s+/g, ' ').trim()]; if (!W || !f.geometry) continue; const g = shiftG(f.geometry); const mp = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const ring = mp.reduce((a, p) => Math.abs(ringArea(p[0])) > Math.abs(ringArea(a)) ? p[0] : a, mp[0][0]); let mx = 0, my = 0; ring.forEach(p => { mx += p[0]; my += p[1]; }); mx /= ring.length; my /= ring.length;
  let sxx = 0, syy = 0, sxy = 0; ring.forEach(p => { const dx = p[0] - mx, dy = p[1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }); const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  regions.push({ k: /Range|Mts|Mount|Hills|Shan|Yoma/i.test(pr.FEATURECLA + pr.NAME) && !/Plateau|Plain|Basin|Desert/i.test(pr.FEATURECLA) ? 'm' : /Desert/.test(pr.FEATURECLA) ? 'd' : 'o', n: W[0], r: W[1], x: +(W[2] || mx).toFixed(2), y: +(W[3] || my).toFixed(2), a: +ang.toFixed(2) }); }
console.log('regions', regions.length);
// ---------- 史料与政权几何 ----------
const D = require(R('data/assemble.js'));
function landNear(poly) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; poly.forEach(q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
  return land.filter(p => { const r = p[0]; let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const q of r) { if (q[0] < a) a = q[0]; if (q[0] > c) c = q[0]; if (q[1] < b) b = q[1]; if (q[1] > d) d = q[1]; } return !(a > x1 || c < x0 || b > y1 || d < y0); }); }
const miss = new Set();
function ref(k) { if (CG[k]) return CG[k]; if (U[k]) return U[k]; miss.add(k); return []; }
const cache = new Map();
function resolve(spec) { const key = JSON.stringify(spec); if (cache.has(key)) return cache.get(key); const pos = [], neg = [];
  for (let it of spec) { let neg_ = false, g = [];
    if (typeof it === 'string') { if (it[0] === '-') { neg_ = true; it = it.slice(1); } g = ref(it); }
    else if (it.m) { const base = ref(it.m); const m = chaikin(it.p, 1); g = base.length ? pc.intersection(base, [[m]]) : []; neg_ = !!it.neg; }
    else if (it.p) { const sm = chaikin(it.p, it.raw ? 0 : 2); if (it.neg) { g = [[sm]]; neg_ = true; } else { const ln = landNear(sm); g = ln.length ? pc.intersection([[sm]], ln) : []; } }
    if (g.length) (neg_ ? neg : pos).push(g); }
  let u = pos.length ? pc.union(...pos) : []; if (u.length && neg.length) u = pc.difference(u, ...neg);
  cache.set(key, u); return u; }
const pipRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const pipMP = (mp, x, y) => { for (const poly of mp) { if (!pipRing(poly[0], x, y)) continue; let h = false; for (let k = 1; k < poly.length; k++) if (pipRing(poly[k], x, y)) { h = true; break; } if (!h) return true; } return false; };
const near = (mp, x, y) => { let best = 1e9; for (const poly of mp) for (const q of poly[0]) { const d = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (d < best) best = d; } return Math.sqrt(best); };
const shapes = [], UU = [], SHU = [], SHI = new Map(); let tot = 0; const t0 = Date.now();
D.S.forEach((s, si) => { const row = []; UU[si] = [];
  s.pol.forEach(pol => { let u = resolve(pol.g); u = cleanMP(u, pol.small ? 0.00005 : 0.004, pol.small ? 0.004 : 0.012); if (!u.length) console.warn('empty polity', s.sn, pol.n); const enc = encMP(u); if (!SHI.has(enc)) { SHI.set(enc, SHU.length); SHU.push(enc); let n = 0; u.forEach(p => p.forEach(r => n += r.length)); tot += n; } row.push(SHI.get(enc)); UU[si].push(u); });
  shapes.push(row); process.stdout.write('.'); });
console.log('\npolity pts', tot, (Date.now() - t0) + 'ms', 'missing refs:', [...miss].join(','));
function polAt(si, x, y) { const L = UU[si] || []; let hit = -1; for (let j = 0; j < L.length; j++) if (pipMP(L[j], x, y)) hit = j; if (hit >= 0) return hit; let bj = -1, bd = 0.3; for (let j = 0; j < L.length; j++) { const d = near(L[j], x, y); if (d < bd) { bd = d; bj = j; } } return bj; }
const stageOf = y => { for (let i = 0; i < D.S.length; i++) if (y < D.S[i].b) return i; return D.S.length - 1; };
const CNZH = { CN: '中国', TW: '中国台湾', HK: '中国香港', MO: '中国澳门', KP: '朝鲜', KR: '韩国', JP: '日本', MN: '蒙古', RU: '俄罗斯', VN: '越南', LA: '老挝', KH: '柬埔寨', TH: '泰国', MM: '缅甸', MY: '马来西亚', SG: '新加坡', BN: '文莱', ID: '印度尼西亚', PH: '菲律宾', TL: '东帝汶', PG: '巴布亚新几内亚', SB: '所罗门群岛', IN: '印度', NP: '尼泊尔', BT: '不丹', BD: '孟加拉国', PK: '巴基斯坦', AF: '阿富汗', KZ: '哈萨克斯坦', KG: '吉尔吉斯斯坦', TJ: '塔吉克斯坦', UZ: '乌兹别克斯坦', AU: '澳大利亚', US: '美国', UM: '美国', GU: '美国关岛', MP: '美国北马里亚纳', PW: '帕劳', FM: '密克罗尼西亚', MH: '马绍尔群岛', KI: '基里巴斯', NR: '瑙鲁', LK: '斯里兰卡' };
function countryAt(x, y) { let best = null, bd = 0.5; for (const k in U) { const mp = U[k]; if (pipMP(mp, x, y)) return CNZH[k.split('.')[0]] || ''; } for (const k in U) { const d = near(U[k], x, y); if (d < bd) { bd = d; best = k; } } return best ? CNZH[best.split('.')[0]] || '' : ''; }
D.CI.forEach(c => { c[8] = countryAt(c[1], c[2]); c[9] = D.S.map((s, si) => polAt(si, c[1], c[2])); });
D.PE.forEach(p => p.stops.forEach(st => { st[7] = polAt(stageOf(st[0]), st[1], st[2]); }));
fs.writeFileSync(R('build/data.json'), JSON.stringify(D.out()));
const out = { land: encMP(cleanMP(land, 0.0003, 0.005)), borders: clipLines(meshC), prov: clipLines(meshP), rivers, lakes, regions, shapes, shu: SHU };
fs.writeFileSync(R('build/geo.json'), JSON.stringify(out));
const sz = k => JSON.stringify(out[k]).length; console.log('sizes', ['land', 'borders', 'prov', 'rivers', 'lakes', 'regions', 'shapes', 'shu'].map(k => k + ':' + sz(k)).join(' '), 'data.json', fs.statSync(R('build/data.json')).size);
