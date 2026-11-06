// 日期 ↔ 小数年
function T(s) { if (typeof s === 'number') return s; const m = String(s).match(/^(-?\d{1,4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/); if (!m) throw new Error('bad date ' + s);
  const y = +m[1], mo = m[2] ? +m[2] : 1, d = m[3] ? +m[3] : (m[2] ? 15 : 1);
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; const ml = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let doy = d - 1; for (let i = 0; i < mo - 1; i++) doy += ml[i]; return +(y + (doy + 0.5) / (leap ? 366 : 365)).toFixed(5); }
module.exports = { T };
