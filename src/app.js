(function(){
'use strict';
/* ---------- 字体：异步加载，不阻塞页面；国内无法访问时自动回退到系统字体 ---------- */
(function(){try{const add=h=>{const l=document.createElement('link');l.rel='stylesheet';l.href=h;l.crossOrigin='anonymous';document.head.appendChild(l)};
  add('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Noto+Sans+SC:wght@400;500;700&display=swap');
  add('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&text='+encodeURIComponent('烽火舆图寻址大元帅上中少将校尉士列兵')+'&display=swap')}catch(e){}})();
const G=window.GEO,D=window.DATA,S=D.S,N=S.length;
const $=s=>document.querySelector(s);
const cv=$('#map'),ctx=cv.getContext('2d');
let W=0,H=0,dpr=1,need=true;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sstep=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const my=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI;
const iy=v=>Math.atan(Math.sinh(v*Math.PI/180))*180/Math.PI;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KN={M:'重大战役',B:'重要战斗',T:'关键转折',E:'历史事件',P:'条约外交'},KC={M:'#b5452f',B:'#d27a3a',T:'#7a4fa0',E:'#3f8a74',P:'#c6952b'};
const FT={army:'部队',fleet:'舰队',fort:'要塞',air:'航空兵'};
const isWin=/Win/i.test((navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||navigator.userAgent);
let SERIF='"Noto Serif SC","Source Han Serif SC","Source Han Serif CN","Songti SC","STSong","Noto Serif CJK SC","SimSun",serif';
const SANS='"Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
function hex(h){const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]}
const rgb=(a,al)=>al==null?'rgb('+a.map(Math.round)+')':'rgba('+a.map(Math.round)+','+al+')';
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const cnD='〇一二三四五六七八九';
function cnNum(n){if(n<=0)return String(n);if(n<10)return cnD[n];if(n<20)return'十'+(n%10?cnD[n%10]:'');if(n<100)return cnD[Math.floor(n/10)]+'十'+(n%10?cnD[n%10]:'');return String(n)}
function km(a,b,c,d){const R=6371,r=Math.PI/180;const dl=(c-a)*r,dp=(d-b)*r;const h=Math.sin(dp/2)**2+Math.cos(b*r)*Math.cos(d*r)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
/* ---------- 日期 ---------- */
function T(s){const m=String(s).match(/^(\d{4})(?:\D+(\d{1,2}))?(?:\D+(\d{1,2}))?/);if(!m)return NaN;const y=+m[1],mo=m[2]?+m[2]:1,d=m[3]?+m[3]:(m[2]?15:1);const leap=(y%4===0&&y%100!==0)||y%400===0;const ml=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];let doy=d-1;for(let i=0;i<mo-1;i++)doy+=ml[i];return +(y+(doy+.5)/(leap?366:365)).toFixed(5)}
const ym=t=>{const y=Math.floor(t);return[y,clamp(Math.floor((t-y)*12)+1,1,12)]};
const fYM=t=>{const [y,m]=ym(t);return y+'年'+m+'月'};
const fSh=s=>String(s).split('-').map((v,i)=>i?String(+v):v).join('.');
const fDS=s=>{const p=String(s).split('-');return p[0]+'年'+(p[1]?(+p[1])+'月':'')+(p[2]?(+p[2])+'日':'')};
function cnEra(t){const y=Math.floor(t);if(t<1912.117){const e=D.ERA_CN.find(e=>y>=e[1]&&y<=e[2]);if(!e)return'';const n=y-e[1]+1;return e[0]+(n===1?'元年':cnNum(n)+'年')}if(t<1949.75){const n=y-1911;return'民国'+(n===1?'元年':cnNum(n)+'年')}return''}
function jpEra(t){const y=Math.floor(t);const e=D.ERA_JP.find(e=>y>=e[1]&&y<=e[2]);if(!e)return'';const n=y-e[1]+1;return'日本'+e[0]+(n===1?'元年':cnNum(n)+'年')}
const leader=(g,t)=>{const r=D.RU.find(r=>r[0]===g&&t>=r[3]&&t<r[4]);return r?r[1]+' '+r[2]:''};
function groupsAt(t){const g=['中国'];if(t>=1927.3&&t<1949.75)g.push('中共');if(t>=1949.75)g.push('台湾');if(t>=1932.18&&t<1945.63)g.push('伪满');if(t>=1940.25&&t<1944.9)g.push('汪伪');if(t<1945.7)g.push('日本','日本首相');else if(t<1955)g.push('日本首相');if(t>=1941.9)g.push('美国');if(t>=1950.48&&t<1980)g.push('朝鲜');if(t>=1945.67)g.push('越南');if(t>=1962.8&&t<1962.95)g.push('印度');if(t<1922||t>=1945.5&&t<1946.5||t>=1969&&t<1975)g.push(t<1917.85?'俄国':'苏联');return g}
const PG=[['日本','日本首相'],['日军','日本首相'],['日占','日本首相'],['美国','美国'],['苏联','苏联'],['俄','俄国'],['朝鲜民主','朝鲜'],['大韩','朝鲜'],['越南','越南'],['印度','印度'],['伪满','伪满'],['汪伪','汪伪'],['台湾','台湾'],['共产党','中共'],['根据地','中共'],['红军','中共'],['边区','中共']];
function leaderFor(polName,t){if(!polName)return'';for(const [k,g] of PG)if(polName.includes(k)){const l=leader(g,t)||(g==='日本首相'?leader('日本',t):'');if(l)return l}return leader('中国',t)}
function dateLine(t,short){let s=fYM(t);const c=cnEra(t);if(c)s+=' · '+c;if(t<1945.7&&!short)s+=' · '+jpEra(t);const l=leader('中国',t);if(l)s+=' · '+l;return s}
/* ---------- 几何解码 ---------- */
function dec(s){const o=[];let i=0,x=0,y=0;const L=s.length;while(i<L){let b,sh=0,r=0;do{b=s.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);x+=(r&1)?~(r>>1):(r>>1);sh=0;r=0;do{b=s.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);y+=(r&1)?~(r>>1):(r>>1);o.push(x/100,my(y/100))}return o}
function decMP(s){if(!s)return[];return s.split(';').map(p=>p.split(',').map(dec))}
function mpPath(mp,info){const p=new Path2D();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,A=0,best=null;
  for(const poly of mp){poly.forEach((r,ri)=>{if(r.length<4)return;p.moveTo(r[0],r[1]);for(let i=2;i<r.length;i+=2)p.lineTo(r[i],r[i+1]);p.closePath();
    if(ri===0){let a=0,cx=0,cy=0;const n=r.length/2;for(let i=0;i<n;i++){const j=(i+1)%n,xa=r[2*i],ya=r[2*i+1],xb=r[2*j],yb=r[2*j+1],c=xa*yb-xb*ya;a+=c;cx+=(xa+xb)*c;cy+=(ya+yb)*c;if(xa<x0)x0=xa;if(xa>x1)x1=xa;if(ya<y0)y0=ya;if(ya>y1)y1=ya}a/=2;A+=Math.abs(a);if(a&&(!best||Math.abs(a)>best.a))best={a:Math.abs(a),x:cx/(6*a),y:cy/(6*a)}}})}
  if(info){info.b=[x0,y0,x1,y1];info.A=A;info.c=best}return p}
const lines=s=>{const p=new Path2D();if(s)s.split(',').forEach(q=>{const r=dec(q);p.moveTo(r[0],r[1]);for(let i=2;i<r.length;i+=2)p.lineTo(r[i],r[i+1])});return p};
const landPath=mpPath(decMP(G.land)),borderPath=lines(G.borders),provPath=lines(G.prov);
const RIV=G.rivers.map(r=>{const f=dec(r.d);const p=new Path2D();p.moveTo(f[0],f[1]);for(let i=2;i<f.length;i+=2)p.lineTo(f[i],f[i+1]);return{p,f,r:r.r,n:r.n,len:r.len}});
const LAKE=G.lakes.map(l=>{const info={};return{p:mpPath(decMP(l.d),info),n:l.n,info}});
const RL=[];{const by={};RIV.forEach(r=>{if(r.n)(by[r.n]=by[r.n]||[]).push(r)});for(const n in by){by[n].sort((a,b)=>b.len-a.len);by[n].slice(0,n==='长江'||n==='黄河'?3:2).forEach(r=>{if(r.len<1.5)return;const f=r.f,m=Math.floor(f.length/4)*2;const i=Math.max(0,m-4),j=Math.min(f.length-2,m+4);RL.push({n,x:f[m],y:f[m+1],a:Math.atan2(f[j+1]-f[i+1],f[j]-f[i]),rk:r.r})})}}
const SHP=G.shu.map(s=>{const info={};return{path:mpPath(decMP(s),info),info}});
for(let i=0;i<N;i++){S[i].pol.forEach((p,j)=>{const sh=SHP[G.shapes[i][j]];p.sid=G.shapes[i][j];p.path=sh.path;p.info=sh.info;const c=hex(p.k);p.c=c;p.fl=rgb(mix(c,[255,255,255],.15));p.dk=rgb(mix(c,[0,0,0],.45));p.lc=rgb(mix(mix(c,[0,0,0],.55),[59,36,24],.45));
  p.lx=p.lab?p.lab[0]:(sh.info.c?sh.info.c.x:0);p.ly=p.lab?my(p.lab[1]):(sh.info.c?sh.info.c.y:0)})}
const relief=new Image();let reliefOK=false;relief.onload=()=>{reliefOK=true;baseKey='';need=true};relief.src=window.RELIEF||'';
/* ---------- 时间轴（分段线性：抗战至朝鲜战争放大） ---------- */
const T0=S[0].a,T1=S[N-1].b-0.002;
const KT=[[T0,0],[1894,.19],[1931,.38],[1954,.82],[S[N-1].b,1]];
function xOf(t){t=clamp(t,KT[0][0],KT[KT.length-1][0]);for(let i=0;i<KT.length-1;i++){const a=KT[i],b=KT[i+1];if(t<=b[0])return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0])}return 1}
function tOf(x){x=clamp(x,0,1);for(let i=0;i<KT.length-1;i++){const a=KT[i],b=KT[i+1];if(x<=b[1])return a[0]+(b[0]-a[0])*(x-a[1])/(b[1]-a[1])}return T1}
const stageAt=t=>{for(let i=0;i<N;i++)if(t<S[i].b)return i;return N-1};
const BX=S.slice(1).map(s=>xOf(s.a));const FW=.0018;
function blendAt(t){const x=xOf(t);for(let k=0;k<BX.length;k++){if(Math.abs(x-BX[k])<FW)return{i0:k,i1:k+1,f:sstep((x-BX[k]+FW)/(2*FW))}}const i=stageAt(t);return{i0:i,i1:i,f:0}}
/* ---------- 视图 ---------- */
const BB={x0:68,x1:205,y0:my(-13),y1:my(56)};
const view={cx:115,cy:my(34),s:22};let viewVer=0;
const isMob=()=>window.innerWidth<=820;
function panelW(){return(!isMob()&&!$('#panel').hidden)?400:0}
function fitBox(x0,y0,x1,y1,pad){const pw=panelW();pad=pad||60;const sheet=isMob()&&!$('#panel').hidden;const aw=W-pw-pad*2,ah=sheet?H*.36-20:H-pad*2-(isMob()?80:40);const s=clamp(Math.min(aw/Math.max(.5,x1-x0),ah/Math.max(.5,y1-y0)),4,260);const sy=sheet?H*.2:H/2;return{s,cx:(x0+x1)/2+pw/2/s,cy:(y0+y1)/2-(H/2-sy)/s}}
function clampView(){const minS=Math.max(W/(BB.x1-BB.x0),H/(BB.y1-BB.y0));view.s=clamp(view.s,minS,320);const hx=W/2/view.s,hy=H/2/view.s,pr=panelW()/view.s,pb=isMob()&&!$('#panel').hidden?H*.55/view.s:0;view.cx=clamp(view.cx,BB.x0+hx,Math.max(BB.x0+hx,BB.x1-hx+pr));view.cy=clamp(view.cy,Math.min(BB.y1-hy,BB.y0+hy-pb),BB.y1-hy)}
const HOME=()=>fitBox(97,my(17),136,my(50),24);
function fitAll(){Object.assign(view,HOME());clampView();viewVer++;need=true}
const w2s=(x,y)=>[(x-view.cx)*view.s+W/2,(view.cy-y)*view.s+H/2];
const s2w=(px,py)=>[(px-W/2)/view.s+view.cx,view.cy-(py-H/2)/view.s];
function zoomAt(px,py,k){const [x,y]=s2w(px,py);view.s*=k;clampView();view.cx=x-(px-W/2)/view.s;view.cy=y+(py-H/2)/view.s;clampView();viewVer++;need=true}
function setWorld(x){const m=view.s*dpr;x.setTransform(m,0,0,-m,(W/2-view.cx*view.s)*dpr,(H/2+view.cy*view.s)*dpr)}
/* ---------- 状态 ---------- */
let yr=T('1937-07-08'),anim={},playing=false,speed=1,hiPol=-1,hiFo=-1,ghost=null,ghostPrev=-1,domIdx=-1;
const opt={relief:true,river:true,border:false,prov:false,force:true,arrow:true,city:true,pass:true,event:true,region:true,ghost:true};
let sel=null,quiz=null;
const EV=D.EV.map((e,i)=>({i,t:e[0],lon:e[1],lat:e[2],n:e[3],k:e[4],d:e[5],sc:e[6],ds:e[7]}));
EV.forEach(e=>e.si=stageAt(e.t));
const CI=D.CI.map(c=>({id:c[0],lon:c[1],lat:c[2],from:c[3],to:c[4],imp:c[5],names:c[6],cap:c[7]||[],mod:c[8]||'',pol:c[9]||[]}));
const CIx={};CI.forEach(c=>CIx[c.id]=c);
function nearCity(lon,lat,r){let b=null,bd=r;for(const c of CI){const d=Math.hypot(c.lon-lon,c.lat-lat);if(d<bd){bd=d;b=c}}return b}
const PE=D.PE;PE.forEach(p=>{p.from=p.stops[0][0];p.to=p.stops[p.stops.length-1][0];p.stops.forEach(st=>{st.ci=nearCity(st[1],st[2],.25)})});
const PA=D.PA.map(p=>({id:p[0],n:p[1],lon:p[2],lat:p[3],al:p[4],d:p[5]}));
const cityName=(c,t)=>{let nm=c.names[0][1];for(const a of c.names)if(t>=a[0])nm=a[1];return nm};
const modName=c=>c.names[c.names.length-1][1].replace(/（.*?）/g,'');
const capAt=(c,t)=>c.cap.find(k=>t>=k[0]&&t<k[1]);
/* ---------- 图层缓存 ---------- */
function mk(){const c=document.createElement('canvas');return{c,x:c.getContext('2d'),key:''}}
const base=mk(),pool=[mk(),mk(),mk()],gh=mk();let baseKey='';
function sizeLayers(){for(const L of [base,gh].concat(pool)){L.c.width=Math.round(W*dpr);L.c.height=Math.round(H*dpr);L.key=''}baseKey=''}
function renderBase(){const x=base.x;x.setTransform(1,0,0,1,0,0);
  const g=x.createLinearGradient(0,0,0,base.c.height);g.addColorStop(0,'#dfe7e4');g.addColorStop(1,'#d2dcda');x.fillStyle=g;x.fillRect(0,0,base.c.width,base.c.height);
  x.setTransform(dpr,0,0,dpr,0,0);x.strokeStyle='rgba(80,110,115,.10)';x.lineWidth=1;x.beginPath();
  for(let lo=70;lo<=205;lo+=5){const [px]=w2s(lo,0);x.moveTo(px,0);x.lineTo(px,H)}for(let la=-10;la<=55;la+=5){const [,py]=w2s(0,my(la));x.moveTo(0,py);x.lineTo(W,py)}x.stroke();
  setWorld(x);x.lineJoin='round';
  x.strokeStyle='rgba(240,246,244,.7)';x.lineWidth=9/view.s;x.stroke(landPath);
  x.fillStyle='#ece4d3';x.fill(landPath);
  if(opt.relief&&reliefOK){x.save();x.clip(landPath);x.setTransform(dpr,0,0,dpr,0,0);const [ax,ay]=w2s(68,my(56)),[bx,by]=w2s(205,my(-13));x.globalAlpha=.92;x.drawImage(relief,ax,ay,bx-ax,by-ay);x.globalAlpha=1;x.restore();setWorld(x)}
  if(opt.river){x.fillStyle='#c9d9db';x.strokeStyle='rgba(80,130,150,.55)';x.lineWidth=.7/view.s;for(const l of LAKE){x.fill(l.p);x.stroke(l.p)}
    x.lineCap='round';for(const r of RIV){const w=r.r<=3?1.5:r.r<=5?1.05:.7;if(r.r>6&&view.s<36)continue;x.lineWidth=w/view.s;x.strokeStyle='rgba(70,128,165,.78)';x.stroke(r.p)}}
  if(opt.prov){x.strokeStyle='rgba(110,95,80,.35)';x.lineWidth=.6/view.s;x.setLineDash([2/view.s,2/view.s]);x.stroke(provPath);x.setLineDash([])}
  if(opt.border){x.strokeStyle='rgba(90,80,70,.45)';x.lineWidth=.8/view.s;x.setLineDash([3/view.s,2.5/view.s]);x.stroke(borderPath);x.setLineDash([])}
  x.strokeStyle='rgba(95,120,125,.75)';x.lineWidth=.75/view.s;x.stroke(landPath);
  base.key=baseKey}
function renderPol(L,idx){const x=L.x;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,L.c.width,L.c.height);setWorld(x);x.lineJoin='round';
  for(const p of S[idx].pol){x.globalAlpha=.34;x.fillStyle=p.fl;x.fill(p.path);
    x.save();x.clip(p.path);x.globalAlpha=.2;x.strokeStyle=p.dk;x.lineWidth=7/view.s;x.stroke(p.path);x.restore();
    x.globalAlpha=.85;x.strokeStyle=p.dk;x.lineWidth=1.1/view.s;x.stroke(p.path)}
  x.globalAlpha=1;L.key=idx+':'+viewVer}
function polLayer(idx,keep){const k=idx+':'+viewVer;let L=pool.find(l=>l.key===k);if(!L){L=pool.find(l=>!keep.some(i=>l.key.startsWith(i+':')))||pool[0];renderPol(L,idx)}return L}
function renderGhost(gi,ci,preview){const x=gh.x;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,gh.c.width,gh.c.height);setWorld(x);x.lineJoin='round';x.lineCap='round';
  const cur=new Set(S[ci].pol.map(p=>p.sid));
  for(const p of S[gi].pol){if(!preview&&cur.has(p.sid))continue;if(preview){x.globalAlpha=.1;x.fillStyle='#b5452f';x.fill(p.path)}x.globalAlpha=1;x.strokeStyle='#b5452f';x.lineWidth=2.3/view.s;x.setLineDash([7/view.s,4/view.s]);x.stroke(p.path)}
  x.setLineDash([]);x.globalCompositeOperation='destination-out';x.lineWidth=3.2/view.s;x.stroke(landPath);x.globalCompositeOperation='source-over';
  gh.key=gi+':'+ci+':'+(preview?1:0)+':'+viewVer}
/* ---------- 标注 ---------- */
const SEAS=[['太平洋',165,24,0,22],['南海',114.5,14,0,18],['东海',125.6,29.4,0,16],['黄海',123.6,35.6,0,15],['渤海',120.3,38.9,0,11],['日本海',134.6,40.4,0,16],['鄂霍次克海',149,52,0,15],['菲律宾海',133,18,0,16],['珊瑚海',155,-12,0,14],['爪哇海',111,-5.2,0,12],['孟加拉湾',89,15,0,15],['泰国湾',101.5,10.2,0,11],['西里伯斯海',122.5,3.6,0,11],['安达曼海',96.5,11.5,-70,11],['台湾海峡',119.7,24.2,50,10],['朝鲜海峡',129.0,34.3,40,10],['北部湾',107.6,20.3,0,10],['印度洋',84,2,0,18],['所罗门海',153,-8,0,11],['白令海',182,55,0,13],['苏禄海',120.5,8.5,0,10]];
const HREG=[['华北',115.6,37.4],['中原',113.4,34.0],['江南',119.6,30.6],['塞北',112.5,42.3],['关东',126.3,44.3],['西北',101,37.6],['西南',104,26.6],['岭南',112.6,23.5],['南洋',110,3.5],['印度支那',104.5,15.8],['外东北',134,49]];
let boxes=[];const usedCh=new Set();
const hitBox=(b,sk)=>{for(const o of boxes)if(!(sk&&o.soft)&&b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1])return true;return false};
function spaced(t,x,y,sp,stroke){const ch=[...t];if(!sp){if(stroke)ctx.strokeText(t,x,y);ctx.fillText(t,x,y);return}const ws=ch.map(c=>ctx.measureText(c).width);const tot=ws.reduce((a,b)=>a+b,0)+sp*(ch.length-1);let cx=x-tot/2;const al=ctx.textAlign;ctx.textAlign='left';ch.forEach((c,i)=>{if(stroke)ctx.strokeText(c,cx,y);ctx.fillText(c,cx,y);cx+=ws[i]+sp});ctx.textAlign=al}
const textW=(t,sp)=>ctx.measureText(t).width+sp*([...t].length-1);
function label(t,x,y,o){ctx.font=o.font;const w=textW(t,o.sp||0),h=parseFloat(o.font.match(/(\d+(\.\d+)?)px/)[1]);
  let b;if(o.ang){const r=Math.max(w,h)/2;b=[x-r*Math.abs(Math.cos(o.ang))-h/2,y-r*Math.abs(Math.sin(o.ang))-h/2,x+r*Math.abs(Math.cos(o.ang))+h/2,y+r*Math.abs(Math.sin(o.ang))+h/2]}else b=[x-w/2-2,y-h/2-1,x+w/2+2,y+h/2+1];
  if(b[2]<0||b[0]>W||b[3]<0||b[1]>H)return false;if(!o.force&&hitBox(b))return false;if(o.soft)b.soft=true;boxes.push(b);for(const c of t)usedCh.add(c);
  ctx.save();ctx.translate(x,y);if(o.ang)ctx.rotate(o.ang);ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  if(o.halo){ctx.strokeStyle=o.halo;ctx.lineWidth=o.hw||3}ctx.fillStyle=o.fill;ctx.globalAlpha=o.al==null?1:o.al;spaced(t,0,0,o.sp||0,!!o.halo);ctx.restore();return true}
function gate(x,y,hot){ctx.save();ctx.translate(x,y);ctx.fillStyle=hot?'#b5452f':'#fdf6ea';ctx.strokeStyle=hot?'#fff9f0':'#8c3b22';ctx.lineWidth=1.1;ctx.lineJoin='round';
  ctx.beginPath();ctx.rect(-7,-5,4,10);ctx.rect(3,-5,4,10);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-8.5,-5);ctx.lineTo(8.5,-5);ctx.lineTo(7,-7.5);ctx.lineTo(-7,-7.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-3,-2);ctx.lineTo(3,-2);ctx.stroke();ctx.restore()}
function forceIcon(c,x,y,type,col,hot,sc){c.save();c.translate(x,y);if(sc)c.scale(sc,sc);c.lineJoin='round';c.lineWidth=1.6;c.strokeStyle=col;c.fillStyle='#fffdf8';
  if(type==='fleet'){c.beginPath();c.moveTo(-10,0);c.lineTo(10,0);c.lineTo(7,5);c.lineTo(-7,5);c.closePath();c.fillStyle=col;c.fill();c.strokeStyle='#fffdf8';c.lineWidth=1.2;c.stroke();c.beginPath();c.moveTo(-3,0);c.lineTo(-3,-6);c.lineTo(4,-6);c.lineTo(4,0);c.fillStyle=col;c.fill();c.stroke();c.beginPath();c.moveTo(0,-6);c.lineTo(0,-10);c.strokeStyle=col;c.stroke()}
  else if(type==='fort'){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?4.2:8.5;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fillStyle=col;c.fill();c.strokeStyle='#fffdf8';c.lineWidth=1.2;c.stroke()}
  else if(type==='air'){c.beginPath();c.moveTo(0,-8);c.lineTo(2,-2);c.lineTo(9,1);c.lineTo(9,3);c.lineTo(2,1.5);c.lineTo(1.5,6);c.lineTo(4,8);c.lineTo(-4,8);c.lineTo(-1.5,6);c.lineTo(-2,1.5);c.lineTo(-9,3);c.lineTo(-9,1);c.lineTo(-2,-2);c.closePath();c.fillStyle=col;c.fill();c.strokeStyle='#fffdf8';c.lineWidth=1;c.stroke()}
  else{c.beginPath();c.rect(-9,-6,18,12);c.fill();c.stroke();c.beginPath();c.moveTo(-9,-6);c.lineTo(9,6);c.moveTo(9,-6);c.lineTo(-9,6);c.lineWidth=1.3;c.stroke()}
  c.restore()}
function iconSVG(type,col){const s='<svg class="fo-ic" viewBox="-11 -11 22 22">';if(type==='fleet')return s+'<path d="M-10 0h20l-3 5h-14z" fill="'+col+'"/><path d="M-3 0v-6h7v6" fill="'+col+'"/></svg>';if(type==='fort')return s+'<path d="M0-8.5 2.5-3.4 8.1-2.6 4-1.3 5 4.7 0 2 -5 4.7 -4-1.3 -8.1-2.6 -2.5-3.4z" fill="'+col+'"/></svg>';if(type==='air')return s+'<path d="M0-8 2-2 9 1v2L2 1.5 1.5 6 4 8h-8l2.5-2L-2 1.5-9 3V1l7-3z" fill="'+col+'"/></svg>';return s+'<rect x="-9" y="-6" width="18" height="12" fill="#fffdf8" stroke="'+col+'" stroke-width="1.8"/><path d="M-9-6 9 6M9-6-9 6" stroke="'+col+'" stroke-width="1.5"/></svg>'}
function drawArrow(pts,col,name,al){if(pts.length<2)return;ctx.save();ctx.globalAlpha=al;ctx.lineCap='round';ctx.lineJoin='round';
  const path=new Path2D();path.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length-1;i++){const mx=(pts[i][0]+pts[i+1][0])/2,mY=(pts[i][1]+pts[i+1][1])/2;path.quadraticCurveTo(pts[i][0],pts[i][1],mx,mY)}const e=pts[pts.length-1],p=pts[pts.length-2];
  const a=Math.atan2(e[1]-p[1],e[0]-p[0]);const ex=e[0]-Math.cos(a)*18,ey=e[1]-Math.sin(a)*18;path.lineTo(ex,ey);
  ctx.strokeStyle='rgba(255,252,245,.85)';ctx.lineWidth=15;ctx.stroke(path);ctx.strokeStyle=col;ctx.lineWidth=9;ctx.stroke(path);
  ctx.beginPath();ctx.moveTo(e[0]+Math.cos(a)*6,e[1]+Math.sin(a)*6);ctx.lineTo(ex-Math.cos(a+Math.PI/2)*15,ey-Math.sin(a+Math.PI/2)*15);ctx.lineTo(ex+Math.cos(a+Math.PI/2)*15,ey+Math.sin(a+Math.PI/2)*15);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='rgba(255,252,245,.9)';ctx.lineWidth=2.4;ctx.stroke();ctx.restore();
  const m=pts[Math.floor((pts.length-1)/2)],n2=pts[Math.floor((pts.length-1)/2)+1]||e;let ang=Math.atan2(n2[1]-m[1],n2[0]-m[0]);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
  return()=>label(name,(m[0]+n2[0])/2,(m[1]+n2[1])/2-16,{font:'italic 700 11.5px '+SERIF,fill:col,halo:'rgba(249,244,234,.92)',hw:3,ang,al})}
/* ---------- 绘制 ---------- */
let hits=[];
function draw(now){
  const bk=viewVer+'|'+[opt.relief,opt.river,opt.border,opt.prov].join('')+'|'+reliefOK;
  if(bk!==baseKey){baseKey=bk;renderBase()}
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.drawImage(base.c,0,0);
  const moving=!!anim.t||tdrag||playing;const si0=stageAt(yr);const B=moving?blendAt(yr):{i0:si0,i1:si0,f:0};const dom=B.f<.5?B.i0:B.i1;
  if(dom!==domIdx){if(domIdx>=0&&opt.ghost&&!quiz){ghost={gi:domIdx,ci:dom,t0:now};gh.key=''}domIdx=dom;hiFo=-1;onStage()}
  ctx.globalCompositeOperation='multiply';
  const L0=polLayer(B.i0,[B.i0,B.i1]);ctx.globalAlpha=B.i0===B.i1?1:1-B.f;ctx.drawImage(L0.c,0,0);
  if(B.i1!==B.i0){const L1=polLayer(B.i1,[B.i0,B.i1]);ctx.globalAlpha=B.f;ctx.drawImage(L1.c,0,0)}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setTransform(dpr,0,0,dpr,0,0);
  let gAl=0;
  if(ghostPrev>=0&&ghostPrev!==dom&&opt.ghost){const k=ghostPrev+':'+dom+':1:'+viewVer;if(gh.key!==k)renderGhost(ghostPrev,dom,true);gAl=.9}
  else if(ghost&&opt.ghost){const e=(now-ghost.t0)/1000;if(e>3.4)ghost=null;else{const k=ghost.gi+':'+ghost.ci+':0:'+viewVer;if(gh.key!==k)renderGhost(ghost.gi,ghost.ci,false);gAl=e<.9?1:1-sstep((e-.9)/2.5);need=true}}
  if(gAl>0){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=gAl;ctx.drawImage(gh.c,0,0);ctx.globalAlpha=1;ctx.setTransform(dpr,0,0,dpr,0,0)}
  if(hiPol>=0&&S[dom].pol[hiPol]){const p=S[dom].pol[hiPol];ctx.save();setWorld(ctx);const v=new Path2D();const [a,b]=s2w(-10,-10),[c,d]=s2w(W+10,H+10);v.rect(a,d,c-a,b-d);v.addPath(p.path);ctx.fillStyle='rgba(243,238,228,.55)';ctx.fill(v,'evenodd');ctx.strokeStyle=p.dk;ctx.lineWidth=2.6/view.s;ctx.stroke(p.path);ctx.restore();ctx.setTransform(dpr,0,0,dpr,0,0)}
  boxes=[];hits=[];const tt=yr;const sc=view.s;const st=S[dom];
  // 进军箭头
  const arrowLabels=[];
  if(opt.arrow&&!quiz){for(const a of st.ar){const pts=a[2].map(q=>w2s(q[0],my(q[1])));const f=drawArrow(pts,a[0],a[1],.82);if(f)arrowLabels.push(f)}}
  const jp=sel&&sel.type==='person'?drawJourney(now):null;
  if(quiz)drawQuiz();
  const cities=[];
  if(opt.city&&!quiz){for(const c of CI){if(tt<c.from||tt>c.to)continue;const cap=capAt(c,tt);const tier=cap?0:c.imp===1?1:2;if(tier===2&&sc<30)continue;if(tier===1&&sc<9)continue;const [x,y]=w2s(c.lon,my(c.lat));if(x<-20||x>W+20||y<-20||y>H+20)continue;cities.push({c,x,y,cap,tier})}cities.sort((a,b)=>a.tier-b.tier)}
  const evs=[];if(opt.event&&!quiz){for(const e of EV){if(e.si!==dom)continue;const [x,y]=w2s(e.lon,my(e.lat));if(x<-10||x>W+10||y<-10||y>H+10)continue;evs.push({e,x,y})}}
  const pas=[];if(opt.pass&&!quiz&&sc>=24){for(const p of PA){const [x,y]=w2s(p.lon,my(p.lat));if(x<-20||x>W+20||y<-20||y>H+20)continue;pas.push({p,x,y})}}
  const fos=[];if(opt.force&&!quiz){st.fo.forEach((f,i)=>{const [x,y]=w2s(f[3],my(f[4]));if(x<-30||x>W+30||y<-30||y>H+30)return;fos.push({f,i,x,y})})}
  // 政权名（优先）
  const al=B.i0===B.i1?[[B.i0,1]]:[[B.i0,1-sstep((B.f-.2)/.3)],[B.i1,sstep((B.f-.5)/.3)]];
  for(const [si,a] of al){if(a<.05)continue;const list=S[si].pol.map((p,j)=>({p,j})).sort((u,v)=>v.p.info.A-u.p.info.A);
    for(let rk=0;rk<list.length;rk++){const {p,j}=list[rk];const pxA=Math.sqrt(p.info.A)*sc;if(pxA<(p.small?14:40)&&j!==hiPol)continue;const fs=p.small?11.5:clamp(pxA/10,12,32);const [x,y]=w2s(p.lx,p.ly);const t=p.n.length>8&&fs<16?p.n.replace(/（.*?）/,''):p.n;
      label(t,x,y,{font:(fs>18?900:700)+' '+fs.toFixed(1)+'px '+SERIF,fill:p.lc,halo:'rgba(246,241,231,.85)',hw:fs>20?4:3,sp:fs>16?fs*.24:fs*.06,al:a,force:j===hiPol||rk<2&&!p.small})}}
  for(const o of cities){const r=o.tier===0?4.2:o.tier===1?3.3:2.6;boxes.push([o.x-r-1,o.y-r-1,o.x+r+1,o.y+r+1])}
  for(const o of pas)boxes.push([o.x-9,o.y-8,o.x+9,o.y+6]);
  for(const o of fos)boxes.push([o.x-11,o.y-11,o.x+11,o.y+11]);
  if(opt.region){for(const s of SEAS){const [x,y]=w2s(s[1],my(s[2]));const fs=2*clamp(s[4]*(sc/22)**.35,9,s[4]*1.3);label(s[0],x,y,{font:'italic 600 '+fs.toFixed(1)+'px '+SERIF,fill:'rgba(70,108,120,.8)',sp:fs*.45,soft:1,ang:s[3]*Math.PI/180})}
    for(const r of G.regions){const nd=r.r<=1?8:r.r<=2?16:r.r<=3?28:44;if(sc<nd)continue;const [x,y]=w2s(r.x,my(r.y));const m=r.k==='m';const fs=m?23:22;label(r.n,x,y,{font:(m?'600 ':'italic 500 ')+fs+'px '+SERIF,fill:m?'rgba(120,86,56,.82)':'rgba(150,120,70,.78)',halo:'rgba(240,233,218,.6)',hw:2.5,sp:fs*.45,soft:1,ang:m?clamp(-r.a,-1.2,1.2):0})}
    if(sc>=28)for(const h of HREG){const [x,y]=w2s(h[1],my(h[2]));label(h[0],x,y,{font:'italic 500 24px '+SERIF,fill:'rgba(110,98,86,.55)',sp:4,soft:1})}}
  if(opt.river&&sc>=18){for(const r of RL){if(r.rk>5&&sc<34)continue;const [x,y]=w2s(r.x,r.y);let a=-r.a;if(a>Math.PI/2)a-=Math.PI;if(a<-Math.PI/2)a+=Math.PI;label(r.n,x,y,{font:'italic 600 22px '+SERIF,fill:'#3f6f93',halo:'rgba(236,231,218,.85)',hw:4.5,sp:5,soft:1,ang:a})}}
  for(const f of arrowLabels)f();
  // 城市
  for(const o of cities){const {c,x,y,cap,tier}=o;const hot=sel&&sel.type==='city'&&sel.c===c;
    ctx.beginPath();ctx.arc(x,y,tier===0?4.2:tier===1?3.3:2.6,0,6.3);
    if(cap){ctx.fillStyle='#b5452f';ctx.fill();ctx.lineWidth=1.3;ctx.strokeStyle='#fffdf8';ctx.stroke();ctx.beginPath();ctx.arc(x,y,7,0,6.3);ctx.strokeStyle='rgba(181,69,47,.85)';ctx.lineWidth=1.1;ctx.stroke()}
    else{ctx.fillStyle='#fffdf8';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='#2b2622';ctx.stroke()}
    if(hot){const p=(now%1600)/1600;ctx.beginPath();ctx.arc(x,y,8+p*14,0,6.3);ctx.strokeStyle='rgba(181,69,47,'+(.8*(1-p))+')';ctx.lineWidth=2;ctx.stroke();need=true}
    const nm=cityName(c,tt);const fs=tier===0?26:tier===1?24:22;const o2={font:'700 '+fs+'px '+SERIF,fill:cap?'#72190b':'#1c1713',halo:'rgba(249,244,234,.94)',hw:5,force:hot||tier===0};
    ctx.font=o2.font;const w=ctx.measureText(nm).width;label(nm,x+w/2+8,y,o2)||label(nm,x-w/2-8,y,o2);
    hits.push({x,y,r:8,city:c})}
  for(const o of pas){const hot=sel&&sel.type==='pass'&&sel.p===o.p;gate(o.x,o.y,hot);if(hot||sc>=26)label(o.p.n,o.x,o.y+24,{font:'700 22px '+SERIF,fill:'#6e2b17',halo:'rgba(249,244,234,.9)',hw:4.5,force:hot});hits.push({x:o.x,y:o.y,r:11,pass:o.p})}
  // 兵力
  for(const o of fos){const hot=o.i===hiFo||(sel&&sel.type==='force'&&sel.i===o.i&&sel.si===dom);const f=o.f;
    if(hot){const p=(now%1400)/1400;ctx.beginPath();ctx.arc(o.x,o.y,12+p*14,0,6.3);ctx.strokeStyle=f[1];ctx.globalAlpha=.8*(1-p);ctx.lineWidth=2.4;ctx.stroke();ctx.globalAlpha=1;need=true}
    forceIcon(ctx,o.x,o.y,f[2],f[1],hot,hot?1.25:1);if(hot||sc>=20)label(f[0],o.x,o.y+20,{font:'700 14px '+SERIF,fill:f[1],halo:'rgba(249,244,234,.94)',hw:3.5,force:hot});hits.push({x:o.x,y:o.y,r:12,force:o.i})}
  // 大事
  for(const o of evs){const {e,x,y}=o;const hot=sel&&sel.type==='event'&&sel.e===e;const big=e.k==='M';const r=(hot?6.8:big?5.6:4.4);const fut=e.t>tt+.05;
    if(hot){const p=(now%1400)/1400;ctx.beginPath();ctx.arc(x,y,8+p*12,0,6.3);ctx.strokeStyle='rgba(181,69,47,'+(.7*(1-p))+')';ctx.lineWidth=2;ctx.stroke();need=true}
    ctx.save();ctx.globalAlpha=fut?.45:1;ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=KC[e.k]||'#888';ctx.strokeStyle='#fffdf8';ctx.lineWidth=1.6;ctx.fillRect(-r/1.4,-r/1.4,r*1.42,r*1.42);ctx.strokeRect(-r/1.4,-r/1.4,r*1.42,r*1.42);if(big){ctx.strokeStyle=KC.M;ctx.lineWidth=1;ctx.strokeRect(-r/1.4-2.4,-r/1.4-2.4,r*1.42+4.8,r*1.42+4.8)}ctx.restore();
    if(hot||(big&&sc>=18&&!fut)||(sc>40&&Math.abs(e.t-tt)<=1.2))label(e.n,x,y-15,{font:'700 12px '+SERIF,fill:'#5a2a1c',halo:'rgba(249,244,234,.95)',hw:3,force:hot});
    hits.push({x,y,r:9,e})}
  // 重要事件字幕：浮现在发生地旁边，避开已排好的地名与图标
  if(opt.event&&!quiz&&!(sel&&sel.type==='event')){const cl=[];for(const o of evs){const e=o.e;if(!'MBT'.includes(e.k))continue;const age=tt-e.t,win=e.k==='M'?1.2:.5;if(age<0||age>win)continue;cl.push({o,age,fr:age/win})}
    cl.sort((u,v)=>(u.o.e.k==='M'?0:1)-(v.o.e.k==='M'?0:1)||u.age-v.age);
    const blk=[];for(const id of ['#panel','#legend']){const el=$(id);if(el&&!el.hidden&&el.offsetParent){const r=el.getBoundingClientRect(),m=cv.getBoundingClientRect();blk.push([r.left-m.left,r.top-m.top,r.right-m.left,r.bottom-m.top])}}
    let n=0;for(const c of cl){if(n>=5)break;if(drawCaption(c.o,c.fr,c.age,blk))n++}}
  if(jp)jp();
  drawScale();fontsTick()}
const dmy=ds=>ds?ds.slice(0,4)+'年'+(+ds.slice(5,7))+'月'+(+ds.slice(8,10))+'日':'';
function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function drawCaption(o,fr,age,blk){const {e,x,y}=o;const t1=e.n,t2=dmy(e.ds)+' · '+KN[e.k];let t3=(e.d||'').replace(/[\r\n]/g,'');if(t3.length>26)t3=t3.slice(0,26)+'…';
  ctx.save();ctx.font='700 17px '+SERIF;const w1=ctx.measureText(t1).width;ctx.font='500 12.5px '+SERIF;const w2=ctx.measureText(t2).width,w3=ctx.measureText(t3).width;
  const w=Math.min(300,Math.max(w1,w2,w3)+26),h=t3?62:44;const g=14;
  const cand=[];for(const d of [g,70,130,200,300,420])for(let k=0;k<12;k++){const a=(k*5+7)%12*Math.PI/6-Math.PI/2+.26;cand.push([Math.cos(a)*(d+w/2)-w/2,Math.sin(a)*(d+h/2)-h/2])}
  for(const c of cand){const bx=x+c[0],by=y+c[1],b=[bx,by,bx+w,by+h];if(b[0]<4||b[1]<4||b[2]>W-4||b[3]>H-4)continue;if(hitBox(b,true))continue;if(blk.some(r=>b[0]<r[2]&&b[2]>r[0]&&b[1]<r[3]&&b[3]>r[1]))continue;
    boxes.push(b);const al=Math.min(1,age/.05)*(1-sstep((fr-.75)/.25));if(al<.03){ctx.restore();return true}
    ctx.globalAlpha=al;ctx.strokeStyle=KC[e.k];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y);const ex=clamp(x,b[0],b[2]),ey=clamp(y,b[1],b[3]);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.shadowColor='rgba(43,38,34,.28)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;ctx.fillStyle='rgba(251,248,241,.96)';rrect(bx,by,w,h,7);ctx.fill();ctx.shadowColor='transparent';
    ctx.strokeStyle='rgba(120,100,80,.35)';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=KC[e.k];ctx.fillRect(bx,by+6,4,h-12);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle='#3a1a10';ctx.font='700 17px '+SERIF;ctx.fillText(t1,bx+13,by+22);ctx.fillStyle=KC[e.k];ctx.font='500 12.5px '+SERIF;ctx.fillText(t2,bx+13,by+40);
    if(t3){ctx.fillStyle='#5b5046';ctx.fillText(t3,bx+13,by+56)}
    for(const ch of t1+t2+t3)usedCh.add(ch);ctx.restore();return true}
  ctx.restore();return false}
function drawScale(){const lat=iy(view.cy);const kmpx=111.32*Math.cos(lat*Math.PI/180)/view.s;const nice=[50,100,200,300,500,1000,2000];let v=nice[0];for(const n of nice)if(n/kmpx<=110)v=n;const el=$('#scale');const w=Math.round(v/kmpx);const t=v+' km';if(el._t!==t+w){el._t=t+w;el.innerHTML=t+'<i style="width:'+w+'px"></i>'}}
function drawJourney(now){const p=sel.p,st=p.stops;const pts=st.map(s=>w2s(s[1],my(s[2])));ctx.lineCap='round';
  const ctrl=(a,b)=>{const mx=(a[0]+b[0])/2,mY=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1];return[mx-dy*.16,mY+dx*.16]};
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];const c=ctrl(a,b);const done=i<=sel.k;if(Math.hypot(b[0]-a[0],b[1]-a[1])<2)continue;
    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(c[0],c[1],b[0],b[1]);ctx.setLineDash(done?[14,8]:[6,10]);ctx.lineWidth=done?4.4:2.8;ctx.strokeStyle=done?'rgba(181,69,47,.92)':'rgba(181,69,47,.4)';ctx.stroke();ctx.setLineDash([]);
    const t=.55,qx=(1-t)*(1-t)*a[0]+2*(1-t)*t*c[0]+t*t*b[0],qy=(1-t)*(1-t)*a[1]+2*(1-t)*t*c[1]+t*t*b[1],tdx=2*(1-t)*(c[0]-a[0])+2*t*(b[0]-c[0]),tdy=2*(1-t)*(c[1]-a[1])+2*t*(b[1]-c[1]);
    if(Math.hypot(b[0]-a[0],b[1]-a[1])>60){ctx.save();ctx.translate(qx,qy);ctx.rotate(Math.atan2(tdy,tdx));ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-8,-7.2);ctx.lineTo(-8,7.2);ctx.closePath();ctx.fillStyle=done?'#b5452f':'rgba(181,69,47,.45)';ctx.fill();ctx.restore()}}
  let walker=null;if(sel.walk){const e=(now-sel.walk.t0)/sel.walk.dur;if(e<1){const i=sel.walk.to;const a=pts[i-1],b=pts[i];const c=ctrl(a,b);const t=sstep(e);walker=[(1-t)*(1-t)*a[0]+2*(1-t)*t*c[0]+t*t*b[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*c[1]+t*t*b[1]];need=true}else sel.walk=null}
  pts.forEach(q=>boxes.push([q[0]-20,q[1]-20,q[0]+20,q[1]+20]));
  return()=>{const seen=new Map();pts.forEach((q,i)=>{const key=Math.round(q[0]/12)+','+Math.round(q[1]/12);const dup=seen.get(key);seen.set(key,i);const cur=i===sel.k,r=cur?22:17;if(dup!=null&&!cur&&dup!==sel.k)return;const [x,y]=q;
      if(cur){const pp=(now%1800)/1800;ctx.beginPath();ctx.arc(x,y,r+6+pp*24,0,6.3);ctx.strokeStyle='rgba(181,69,47,'+(.6*(1-pp))+')';ctx.lineWidth=3;ctx.stroke();need=true}
      ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fillStyle=cur?'#b5452f':'#fffdf8';ctx.fill();ctx.lineWidth=3.2;ctx.strokeStyle=cur?'#fffdf8':'#b5452f';ctx.stroke();
      ctx.fillStyle=cur?'#fff':'#b5452f';ctx.font='700 '+(cur?24:21)+'px '+SANS;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),x,y+.5);
      if(cur||view.s>30)label(st[i][3].replace(/（.*?）/g,''),x,y-r-14,{font:'700 25px '+SERIF,fill:'#72190b',halo:'rgba(249,244,234,.95)',hw:3,force:cur});
      hits.push({x,y,r:r+4,stop:i})});
    if(walker){ctx.beginPath();ctx.arc(walker[0],walker[1],10,0,6.3);ctx.fillStyle='#b5452f';ctx.fill();ctx.lineWidth=3.5;ctx.strokeStyle='#fff';ctx.stroke()}}}
function drawQuiz(){const q=quiz;if(q.done)return;if(q.pin){const [x,y]=w2s(q.pin[0],my(q.pin[1]));ctx.beginPath();ctx.arc(x,y,8,0,6.3);ctx.strokeStyle='#b5452f';ctx.lineWidth=2.4;ctx.stroke();ctx.beginPath();ctx.arc(x,y,2.5,0,6.3);ctx.fillStyle='#b5452f';ctx.fill();boxes.push([x-9,y-9,x+9,y+9]);
    const ok=$('#qok');if(!q.rev){ok.hidden=false;ok.style.left=x+'px';ok.style.top=y+'px'}else ok.hidden=true}
  if(q.rev){const e=q.cur;const [x,y]=w2s(e.lon,my(e.lat));if(q.pin){const [a,b]=w2s(q.pin[0],my(q.pin[1]));ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(x,y);ctx.setLineDash([6,4]);ctx.strokeStyle='rgba(181,69,47,.8)';ctx.lineWidth=1.8;ctx.stroke();ctx.setLineDash([]);label('约 '+Math.round(q.d)+' 公里',(a+x)/2,(b+y)/2-10,{font:'700 12px '+SERIF,fill:'#72190b',halo:'rgba(249,244,234,.95)',hw:3,force:true})}
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#b5452f';ctx.fillRect(-5,-5,10,10);ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.strokeRect(-5,-5,10,10);ctx.restore();
    label(e.n,x,y-17,{font:'900 15px '+SERIF,fill:'#72190b',halo:'rgba(249,244,234,.96)',hw:3.5,force:true})}}
/* ---------- 按需加载画布用到的字形（Google Fonts 按字符分片） ---------- */
const reqCh=new Set();let fontsBusy=false,fontsOK=null;
function fontsTick(){if(!document.fonts||!document.fonts.load||fontsBusy||fontsOK===false)return;let s='';for(const c of usedCh)if(!reqCh.has(c)){reqCh.add(c);s+=c}if(!s)return;fontsBusy=true;
  Promise.all(['600','700','900'].map(w=>document.fonts.load(w+' 14px "Noto Serif SC"',s))).then(r=>{fontsBusy=false;if(r.some(a=>a&&a.length)){fontsOK=true;viewVer++;need=true}}).catch(()=>{fontsBusy=false})}
setTimeout(()=>{try{if(document.fonts&&!document.fonts.check('700 12px "Noto Serif SC"','国')){fontsOK=false;if(isWin){SERIF='"Microsoft YaHei","SimHei","Noto Sans SC",sans-serif';viewVer++;need=true}}}catch(e){}},6000);
/* ---------- 主循环 ---------- */
let last=performance.now();
function loop(now){const dt=Math.min(.08,(now-last)/1000);last=now;let act=false;
  if(anim.t){const a=anim.t;const p=clamp((now-a.t0)/a.dur,0,1);const e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;yr=tOf(a.x0+(a.x1-a.x0)*e);if(p>=1){anim.t=null;yr=a.y1}act=true}
  if(anim.v){const a=anim.v;const p=clamp((now-a.t0)/a.dur,0,1);const e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;view.s=Math.exp(Math.log(a.f.s)+(Math.log(a.to.s)-Math.log(a.f.s))*e);view.cx=a.f.cx+(a.to.cx-a.f.cx)*e;view.cy=a.f.cy+(a.to.cy-a.f.cy)*e;clampView();viewVer++;if(p>=1)anim.v=null;act=true}
  if(playing){const x=xOf(yr)+dt*speed/110;yr=tOf(x);if(x>=1){yr=T1;stopPlay()}act=true}
  if(act||need){need=false;draw(now);syncTime()}
  requestAnimationFrame(loop)}
function jumpYear(t,dur){t=clamp(t,T0,T1);anim.t={t0:performance.now(),x0:xOf(yr),x1:xOf(t),y1:t,dur:dur||900};need=true}
function flyTo(lon,lat,s){const z=s||Math.max(view.s,30);const pw=panelW();anim.v={t0:performance.now(),f:{cx:view.cx,cy:view.cy,s:view.s},to:{cx:lon+pw/2/z,cy:my(lat)-(isMob()&&!$('#panel').hidden?H*.25/z:0),s:z},dur:850};need=true}
function flyBox(b){const f=fitBox(b[0],b[1],b[2],b[3],50);anim.v={t0:performance.now(),f:{cx:view.cx,cy:view.cy,s:view.s},to:f,dur:850};need=true}
const PLAY='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',PAUSE='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
function stopPlay(){playing=false;$('#play').innerHTML=PLAY}
/* ---------- 时间轴 ---------- */
const track=$('#track'),bands=$('#bands'),head=$('#head'),htip=$('#htip');
function buildTrack(){bands.innerHTML='';track.querySelectorAll('.tk').forEach(n=>n.remove());const tw=track.getBoundingClientRect().width||800;
  D.G.forEach((g,gi)=>{const a=xOf(g[0]),b=xOf(g[1]);const d=document.createElement('div');d.className='band';d.dataset.g=gi;d.style.left=a*100+'%';d.style.width=(b-a)*100+'%';d.style.background=g[3];d.textContent=(b-a)*tw>g[2].length*12+8?g[2]:'';bands.appendChild(d)});
  S.forEach((s,i)=>{if(!i)return;const d=document.createElement('div');d.className='sep';d.style.left=xOf(s.a)*100+'%';bands.appendChild(d)});
  for(const e of EV){if(e.k!=='M'&&e.k!=='T')continue;const d=document.createElement('div');d.className='evt';d.style.left=xOf(e.t)*100+'%';bands.appendChild(d)}
  let lastX=-1e9;const ticks=[1840,1860,1894,1911,1931,1937,1945,1949,1950,1953,1962,1979];
  for(const y of ticks){const x=xOf(y+.01)*tw;if(x-lastX<38)continue;lastX=x;const k=document.createElement('div');k.className='tk';k.style.left=xOf(y+.01)*100+'%';k.textContent=y;track.appendChild(k)}}
let lastYS='',lastG=-1;
function syncTime(){const x=xOf(yr);head.style.left=x*100+'%';
  let t=dateLine(yr,isMob());if(sel&&sel.type==='person'){const s=sel.p.stops[sel.k];if(Math.abs(s[0]-yr)<.02){const l=leaderFor(polAtStop(s),yr);t=fYM(yr)+(cnEra(yr)?' · '+cnEra(yr):'')+(l?' · '+l:'')}}
  if(t!==lastYS){lastYS=t;htip.textContent=t}
  const fr=$('footer').getBoundingClientRect(),tr=track.getBoundingClientRect();const hx=tr.left-fr.left+x*tr.width;const w=htip.offsetWidth;htip.style.left=clamp(hx-w/2,isMob()?66:8,fr.width-w-8)+'px';
  if(document.activeElement!==$('#yin')){const [y,m]=ym(yr);$('#yin').value=y+'-'+String(m).padStart(2,'0')}
  const gi=D.G.findIndex(g=>yr<g[1]);if(gi!==lastG){lastG=gi;bands.querySelectorAll('.band').forEach(b=>b.classList.toggle('cur',+b.dataset.g===gi))}}
function setFromX(e){const r=track.getBoundingClientRect();const x=clamp((e.clientX-r.left)/r.width,0,1);anim.t=null;stopPlay();yr=tOf(x);need=true}
let tdrag=false;
track.addEventListener('pointerdown',e=>{track.setPointerCapture(e.pointerId);tdrag=true;ghostPrev=-1;setFromX(e)});
track.addEventListener('pointermove',e=>{if(tdrag){setFromX(e);return}if(e.pointerType!=='mouse')return;const r=track.getBoundingClientRect();const t=tOf((e.clientX-r.left)/r.width);const i=stageAt(t);if(i!==ghostPrev){ghostPrev=i;need=true}showTip(e.clientX-cv.getBoundingClientRect().left,cv.getBoundingClientRect().height-6,'<b>'+fYM(S[i].a)+'—'+fYM(S[i].b-.001)+'</b>'+esc(S[i].sn+' · '+S[i].era))});
track.addEventListener('pointerleave',()=>{ghostPrev=-1;hideTip();need=true});
track.addEventListener('pointerup',()=>{tdrag=false;need=true});track.addEventListener('pointercancel',()=>{tdrag=false});
$('#play').onclick=()=>{if(playing){stopPlay();return}if(yr>=T1-.05)yr=T0;playing=true;$('#play').innerHTML=PAUSE;need=true};
$('#spd').onclick=()=>{speed=speed===1?2:speed===2?4:speed===4?.5:1;$('#spd').textContent=(speed===.5?'0.5':speed)+'×'};
const stepM=d=>{anim.t=null;const mi=Math.floor(yr*12+1e-6)+d;yr=clamp((mi+.5)/12,T0,T1);need=true};
$('#yp').onclick=()=>stepM(-1);$('#yn').onclick=()=>stepM(1);
$('#yin').addEventListener('change',e=>{const v=T(e.target.value.trim());if(!isNaN(v))jumpYear(v)});
$('#yin').addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur()});
/* ---------- 图例与面板 ---------- */
let tab='ev';
function onStage(){renderLegend();if(!$('#panel').classList.contains('carding'))renderList()}
function renderLegend(){const i=domIdx,s=S[i];const gi=D.G.findIndex(g=>s.a<g[1]-1e-6);const inG=S.map((t,k)=>k).filter(k=>S[k].a>=D.G[gi][0]-1e-6&&S[k].a<D.G[gi][1]-1e-6);
  const lg=$('#legend');const min=lg.classList.contains('min');const mid=(s.a+s.b)/2;const lead=groupsAt(mid).map(g=>leader(g,mid)).filter(Boolean).slice(0,4);
  lg.innerHTML='<div class="lh"><div class="stg">'+esc(s.sn)+' · 阶段 '+(i+1)+'/'+N+'（'+fYM(s.a)+'—'+fYM(s.b-.001)+'）</div><div class="dots">'+inG.map(k=>'<i data-i="'+k+'" class="'+(k===i?'on':'')+'" title="'+esc(S[k].sn)+'"></i>').join('')+'</div><button id="lgx" aria-label="'+(min?'展开':'收起')+'图例">'+(min?'＋':'－')+'</button></div>'+
  '<div class="lt">'+esc(s.era)+'</div><div class="lr">'+esc(lead.join(' · '))+'</div>'+
  '<div class="pl">'+s.pol.map((p,j)=>'<button data-j="'+j+'"><span class="sw" style="background:'+rgb(p.c,.4)+';border-color:'+p.dk+'"></span>'+esc(p.n)+'</button>').join('')+'</div>'+
  (s.fo.length?'<div class="fl"><div class="ft">兵力部署 · 悬停高亮，点击聚焦</div>'+s.fo.map((f,k)=>'<button data-f="'+k+'" title="'+esc((f[5]?'指挥：'+f[5]+'\n':'')+(f[7]?'装备：'+f[7]:''))+'">'+iconSVG(f[2],f[1])+'<span><b>'+esc(f[0])+'</b> '+esc(f[6])+'</span></button>').join('')+'</div>':'')+
  '<div class="sy"><span><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#b5452f" stroke="#fff"/></svg>首都/驻地</span><span><svg width="12" height="12"><rect x="3" y="3" width="6" height="6" transform="rotate(45 6 6)" fill="#b5452f" stroke="#fff"/></svg>战役</span><span><svg width="18" height="12" viewBox="-9 -8 18 14"><rect x="-7" y="-5" width="4" height="10" fill="#fdf6ea" stroke="#8c3b22"/><rect x="3" y="-5" width="4" height="10" fill="#fdf6ea" stroke="#8c3b22"/><path d="M-8.5-5h17l-1.5-2.5h-14z" fill="#fdf6ea" stroke="#8c3b22"/></svg>要塞</span><span><svg width="26" height="8"><path d="M1 4h24" stroke="#b5452f" stroke-width="2.2" stroke-dasharray="5 3"/></svg>残影/行迹</span></div>'}
$('#legend').addEventListener('pointerover',e=>{const b=e.target.closest('.pl button');const j=b?+b.dataset.j:-1;if(j!==hiPol){hiPol=j;need=true}const f=e.target.closest('.fl button');const k=f?+f.dataset.f:-1;if(k!==hiFo){hiFo=k;need=true}});
$('#legend').addEventListener('pointerleave',()=>{hiPol=-1;hiFo=-1;need=true});
$('#legend').addEventListener('click',e=>{const b=e.target.closest('.pl button');if(b){flyBox(S[domIdx].pol[+b.dataset.j].info.b);return}const f=e.target.closest('.fl button');if(f){selectForce(domIdx,+f.dataset.f);return}const d=e.target.closest('.dots i');if(d){jumpYear(S[+d.dataset.i].at);return}if(e.target.closest('#lgx')){$('#legend').classList.toggle('min');renderLegend()}});
const evRow=e=>'<button class="ev" data-ev="'+e.i+'"><span class="y">'+fSh(e.ds)+'</span><span><b><i class="k k-'+e.k+'"></i>'+esc(e.n)+'</b><em>'+esc(e.d)+'</em>'+(e.sc?'<span class="sc">'+esc(e.sc)+'</span>':'')+'</span></button>';
function renderList(){const L=$('#list');let h='';const s=S[domIdx];
  if(tab==='ev'){const es=EV.filter(e=>e.si===domIdx);h='<div class="sub">'+esc(s.sn)+' · '+fYM(s.a)+'—'+fYM(s.b-.001)+' · 共 '+es.length+' 事</div><p style="font-size:12.5px;color:var(--ink2);margin:0 4px 8px;line-height:1.65">'+esc(s.note)+'</p>'+(es.map(evRow).join('')||'<div class="empty">此期未收录战事。</div>')}
  else if(tab==='pe'){const alive=PE.filter(p=>p.stops.some(x=>x[0]>=s.a&&x[0]<s.b));const row=p=>'<button class="row" data-pe="'+p.id+'"><b>'+esc(p.n)+'</b><span style="font-size:12px;color:var(--ink2);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.role)+'</span><small>'+esc(p.life)+'</small></button>';
    h=(alive.length?'<div class="sub">此期人物</div>'+alive.map(row).join(''):'')+'<div class="sub">人物库 · '+PE.length+' 位（点人溯事）</div>'+PE.map(row).join('')}
  else if(tab==='ci'){const t=yr;const cs=CI.filter(c=>t>=c.from&&t<=c.to).sort((a,b)=>(capAt(b,t)?1:0)-(capAt(a,t)?1:0)||a.imp-b.imp);
    h='<div class="sub">'+fYM(t)+' · '+cs.length+' 座城市（点击溯源）</div>'+cs.map(c=>{const cp=capAt(c,t);return'<button class="row" data-ci="'+c.id+'"><b>'+esc(cityName(c,t))+'</b>'+(cp?'<span class="badge o">'+esc(cp[2])+'</span>':'')+'<small>今'+esc(modName(c))+' · '+esc(c.mod)+'</small></button>'}).join('')}
  else if(tab==='fo'){h='<div class="sub">'+esc(s.sn)+' · 兵力部署（'+s.fo.length+'）</div>'+(s.fo.map((f,k)=>'<button class="ev" data-fo="'+k+'"><span class="y" style="color:'+f[1]+'">'+iconSVG(f[2],f[1])+' '+FT[f[2]]+'</span><span><b>'+esc(f[0])+'</b><em>'+(f[5]?'指挥：'+esc(f[5])+'<br>':'')+'兵力：'+esc(f[6])+(f[7]?'<br>装备：'+esc(f[7]):'')+'</em></span></button>').join('')||'<div class="empty">此期没有标注兵力。</div>')}
  else{h='<div class="sub">'+esc(s.era)+'</div>'+s.pol.map((p,j)=>'<button class="row" data-po="'+j+'"><span class="sw" style="background:'+rgb(p.c,.4)+';border-color:'+p.dk+'"></span><b>'+esc(p.n)+'</b><small>'+esc(leaderFor(p.n,(s.a+s.b)/2))+'</small></button>').join('')}
  L.innerHTML=h;L.scrollTop=0}
$('#list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.ev!=null)selectEvent(EV[+b.dataset.ev]);else if(b.dataset.pe)selectPerson(PE.find(p=>p.id===b.dataset.pe),0);else if(b.dataset.ci)selectCity(CIx[b.dataset.ci]);else if(b.dataset.po!=null)flyBox(S[domIdx].pol[+b.dataset.po].info.b);else if(b.dataset.fo!=null)selectForce(domIdx,+b.dataset.fo)});
$('#list').addEventListener('pointerover',e=>{const b=e.target.closest('[data-po]');const j=b?+b.dataset.po:-1;if(j!==hiPol){hiPol=j;need=true}const f=e.target.closest('[data-fo]');const k=f?+f.dataset.fo:-1;if(k!==hiFo){hiFo=k;need=true}});
$('#list').addEventListener('pointerleave',()=>{hiPol=-1;hiFo=-1;need=true});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));renderList()});
/* ---------- 卡片 ---------- */
const card=$('#card'),panel=$('#panel');
function openCard(html){if(!sel||sel.type!=='person')$('#cap').hidden=true;panel.hidden=false;$('#bPanel').classList.add('on');panel.classList.add('carding');card.innerHTML=html;const cb=card.querySelector('.cb');if(cb)cb.scrollTop=0;card.querySelector('.cx').onclick=closeCard}
function closeCard(){$('#cap').hidden=true;panel.classList.remove('carding');clearInterval(autoT);sel=null;card.innerHTML='';renderList();need=true;if(isMob()){panel.hidden=true;$('#bPanel').classList.remove('on')}}
const cHead=(kick,title,meta)=>'<div class="ch"><div class="kick">'+kick+'</div><h2>'+title+'</h2><div class="meta">'+meta+'</div><button class="cx" aria-label="关闭">×</button></div>';
const kindTag=k=>'<span class="kl" style="background:'+KC[k]+'">'+KN[k]+'</span>';
function selectEvent(e){clearInterval(autoT);sel={type:'event',e};jumpYear(e.t);flyTo(e.lon,e.lat,Math.max(view.s,34));
  const c=nearCity(e.lon,e.lat,.4);const ps=PE.filter(p=>p.stops.some(s=>Math.abs(s[0]-e.t)<=.1&&Math.hypot(s[1]-e.lon,s[2]-e.lat)<.6));
  const same=EV.filter(x=>x!==e&&Math.hypot(x.lon-e.lon,x.lat-e.lat)<.5).slice(0,8);const fo=S[e.si].fo.map((f,k)=>({f,k})).filter(o=>Math.hypot(o.f[3]-e.lon,o.f[4]-e.lat)<2.5);
  openCard(cHead('溯源 · 战事纪要',esc(e.n),kindTag(e.k)+'<span class="badge">'+fDS(e.ds)+'</span><span>'+esc(S[e.si].sn)+'</span>')+'<div class="cb"><p style="font:15px/1.8 var(--serif);margin:4px 0 8px">'+esc(e.d)+'</p>'+(e.sc?'<div class="sc" style="font-size:13px;padding:6px 10px"><b>规模：</b>'+esc(e.sc)+'</div>':'')+
    '<div style="font-size:12.5px;color:var(--ink2);margin-top:8px">'+esc(dateLine(e.t))+'</div>'+
    (fo.length?'<div class="sub" style="margin-top:12px">参战兵力</div>'+fo.map(o=>'<button class="row" data-fo="'+o.k+'">'+iconSVG(o.f[2],o.f[1])+'<b>'+esc(o.f[0])+'</b><small>'+esc(o.f[6])+'</small></button>').join(''):'')+
    (c?'<div class="sub" style="margin-top:12px">发生地</div><button class="row" data-ci="'+c.id+'"><b>'+esc(cityName(c,e.t))+'</b><small>今'+esc(modName(c))+' · '+esc(c.mod)+'</small><span class="lk">溯源 ›</span></button>':'')+
    (ps.length?'<div class="sub">相关人物</div>'+ps.map(x=>'<button class="row" data-pe="'+x.id+'" data-k="'+x.stops.findIndex(s=>Math.abs(s[0]-e.t)<=.1&&Math.hypot(s[1]-e.lon,s[2]-e.lat)<.6)+'"><b>'+esc(x.n)+'</b><small>'+esc(x.role)+'</small></button>').join(''):'')+
    (same.length?'<div class="sub">同地其他史事</div>'+same.map(x=>'<button class="row" data-ev="'+x.i+'"><span class="kl" style="background:'+KC[x.k]+'">'+x.ds.slice(0,4)+'</span><b>'+esc(x.n)+'</b></button>').join(''):'')+'</div>');
  bindCardLinks();need=true}
function selectForce(si,k){const f=S[si].fo[k];if(!f)return;clearInterval(autoT);sel={type:'force',si,i:k};flyTo(f[3],f[4],Math.max(view.s,30));
  const evs=EV.filter(e=>e.si===si&&Math.hypot(e.lon-f[3],e.lat-f[4])<2.5);
  openCard(cHead('兵力 · '+FT[f[2]],esc(f[0]),'<span>'+esc(S[si].sn+' · '+S[si].era)+'</span>')+'<div class="cb"><div class="bio">'+(f[5]?'<b>指挥</b> · '+esc(f[5])+'<br>':'')+'<b>兵力</b> · '+esc(f[6])+(f[7]?'<br><b>装备</b> · '+esc(f[7]):'')+'</div>'+(evs.length?'<div class="sub">附近战事</div>'+evs.map(evRow).join(''):'')+'</div>');bindCardLinks();need=true}
function bindCardLinks(){card.querySelectorAll('[data-ci]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();selectCity(CIx[b.dataset.ci])});card.querySelectorAll('[data-pe]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();selectPerson(PE.find(p=>p.id===b.dataset.pe),+(b.dataset.k||0))});
  card.querySelectorAll('[data-ev]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();selectEvent(EV[+b.dataset.ev])});card.querySelectorAll('[data-fo]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();selectForce(sel&&sel.e?sel.e.si:domIdx,+b.dataset.fo)})}
/* 点人溯事 */
const polAtStop=st=>{const si=stageAt(st[0]);const j=st[7];return j>=0&&S[si].pol[j]?S[si].pol[j].n:null};
let autoT=null;
function selectPerson(p,k){if(!p)return;clearInterval(autoT);sel={type:'person',p,k:k||0,auto:false};renderPerson();goStop(sel.k,true)}
function renderPerson(){const p=sel.p;const nS=new Set(p.stops.map(s=>stageAt(s[0]))).size;
  openCard(cHead('点人溯事 · 人物生平纪事',esc(p.n)+'<span style="font-weight:400;font-size:15px">（'+esc(p.life)+'）</span>','<span>'+p.stops.length+' 处行迹 · 历 '+nS+' 个时期</span><span class="badge" id="pAll" style="cursor:pointer">全图总览</span>')+
  '<div class="cb"><div class="bio"><b>'+esc(p.role)+'</b> · '+esc(p.bio)+'</div>'+p.stops.map((s,i)=>{const c=s.ci;const si=stageAt(s[0]);const pn=polAtStop(s);const ld=leaderFor(pn,s[0]);
    return'<div class="st'+(i===sel.k?' cur':'')+'" data-k="'+i+'"><div><span class="n">'+(i+1)+'</span><span class="yy">'+s[6].slice(0,4)+'年</span><div class="dy">'+esc(fDS(s[6]).slice(5)||S[si].sn)+'<br>'+esc(S[si].sn)+'</div></div><div><div class="pn"><span>'+esc(s[3])+(c&&modName(c)!==s[3].replace(/（.*?）/g,'')?'<small>（今'+esc(modName(c))+'）</small>':'')+'</span>'+(c?'<button class="lk" data-ci="'+c.id+'">溯源 ›</button>':'')+'</div>'+
    (pn?'<div style="font-size:11.5px;color:var(--muted)">属 '+esc(pn)+(ld?' · '+esc(ld):'')+'</div>':'')+'<p>'+esc(s[4])+'</p>'+(s[5]?'<div class="q">'+esc(s[5])+'</div>':'')+'</div></div>'}).join('')+'</div>'+
  '<div class="cf"><button class="btn" id="sP">‹ 上一站</button><button class="btn pri" id="sA">'+(sel.auto?'暂停':'走一遍')+'</button><button class="btn" id="sN">下一站 ›</button><span style="margin-left:auto;font:600 12.5px var(--serif);color:var(--verm)" id="sI">'+(sel.k+1)+' / '+p.stops.length+'</span></div>');
  card.querySelectorAll('.st').forEach(d=>d.onclick=()=>goStop(+d.dataset.k));bindCardLinks();
  $('#sP').onclick=()=>goStop(sel.k-1);$('#sN').onclick=()=>goStop(sel.k+1);$('#sA').onclick=toggleAuto;$('#pAll').onclick=()=>flyBox(spanOf(sel.p.stops))}
function showCap(s){const c=$('#cap');if(!s){c.hidden=true;return}const p=sel.p;const q=s[5]?s[5].split('——'):null;
  c.innerHTML='<div class="who">'+esc(p.n+' · '+fDS(s[6])+' · '+s[3])+'</div>'+(q?'<p>'+esc(q[0])+'</p><small>'+esc(q[1]?'——'+q[1]:'')+'</small>':'<div class="nt">'+esc(s[4])+'</div>');c.hidden=false}
function goStop(k,first){if(!sel||sel.type!=='person')return;const st=sel.p.stops;k=clamp(k,0,st.length-1);const prev=sel.k;sel.k=k;const s=st[k];
  if(!first&&k===prev+1)sel.walk={to:k,t0:performance.now(),dur:1100};
  jumpYear(s[0],first?900:1100);if(first&&!isMob())flyBox(spanOf(st));else flyTo(s[1],s[2],Math.max(view.s,first?22:26));
  showCap(s);card.querySelectorAll('.st').forEach(d=>d.classList.toggle('cur',+d.dataset.k===k));const cur=card.querySelector('.st.cur');if(cur&&!first)cur.scrollIntoView({block:'nearest',behavior:'smooth'});const si=$('#sI');if(si)si.textContent=(k+1)+' / '+st.length;need=true}
function spanOf(st){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;st.forEach(s=>{const lo=clamp(s[1],68,205),la=clamp(s[2],-13,56);x0=Math.min(x0,lo);x1=Math.max(x1,lo);y0=Math.min(y0,my(la));y1=Math.max(y1,my(la))});return[x0-1.5,y0-1.5,x1+1.5,y1+1.5]}
function toggleAuto(){if(!sel||sel.type!=='person')return;sel.auto=!sel.auto;clearInterval(autoT);if(sel.auto){if(sel.k>=sel.p.stops.length-1)goStop(0);autoT=setInterval(()=>{if(!sel||!sel.auto||sel.type!=='person'){clearInterval(autoT);return}if(sel.k>=sel.p.stops.length-1){sel.auto=false;clearInterval(autoT);$('#sA').textContent='走一遍';return}goStop(sel.k+1)},3200)}$('#sA').textContent=sel.auto?'暂停':'走一遍'}
/* 溯源 */
function traceRows(lon,lat,c){const rows=[];
  for(let i=0;i<N;i++){const s=S[i];let a=s.a,b=s.b;if(c){if(c.to<a||c.from>=b)continue;a=Math.max(a,c.from)}
    let j=c?c.pol[i]:-1;if(!c){ctx.setTransform(1,0,0,1,0,0);for(let q=0;q<s.pol.length;q++)if(ctx.isPointInPath(s.pol[q].path,lon,my(lat)))j=q}
    const pn=j>=0&&s.pol[j]?s.pol[j].n:null;const nms=c?[...new Set(c.names.filter((n,k)=>n[0]<b&&(k===c.names.length-1||c.names[k+1][0]>a)).map(n=>n[1]))]:[];
    const caps=c?c.cap.filter(k=>k[0]<b&&k[1]>a).map(k=>k[2]):[];
    const evs=EV.filter(e=>e.t>=a&&e.t<b&&Math.hypot(e.lon-lon,e.lat-lat)<(c?.35:.6));
    const ps=[];PE.forEach(p=>p.stops.forEach((st,k)=>{if(st[0]>=a&&st[0]<b&&Math.hypot(st[1]-lon,st[2]-lat)<.25)ps.push({p,k,st})}));
    const key=pn+'|'+nms.join(',')+'|'+caps.join(',');const lastR=rows[rows.length-1];
    if(lastR&&lastR.key===key&&!evs.length&&!ps.length&&!lastR.evs.length&&!lastR.ps.length){lastR.b=b;lastR.sns.push(s.sn);lastR.idx.push(i);continue}
    rows.push({key,a,b,sns:[s.sn],idx:[i],pn,nms,caps,evs,ps})}
  return rows}
function rowsHTML(rows){const cur=domIdx;return rows.map(r=>'<div class="tr'+(r.idx.includes(cur)?' cur':'')+'"><div class="dn">'+esc([...new Set(r.sns)].slice(0,2).join(' · '))+'<small>'+fYM(r.a)+'<br>—'+fYM(r.b-.001)+'</small></div><div>'+
  (r.nms.length?'<div class="nm">'+esc(r.nms.join(' → '))+(r.caps.length?'<span class="badge">'+esc(r.caps.join('、'))+'</span>':'')+'</div>':'')+
  '<div class="bl">'+(r.pn?'属 '+esc(r.pn):'不在图中所列政权范围')+'</div>'+
  (r.evs.length||r.ps.length?'<ul>'+r.evs.map(e=>'<li data-ev="'+e.i+'"><b>'+fDS(e.ds)+'</b>'+kindTag(e.k)+esc(e.n)+'<em>'+esc(e.d)+(e.sc?'（'+esc(e.sc)+'）':'')+'</em></li>').join('')+r.ps.map(o=>'<li class="pp" data-pe="'+o.p.id+'" data-k="'+o.k+'"><b>'+fDS(o.st[6])+'</b>'+esc(o.p.n)+'：'+esc(o.st[4])+'</li>').join('')+'</ul>':'')+'</div></div>').join('')}
function bindTrace(){card.querySelectorAll('li[data-ev]').forEach(li=>li.onclick=()=>{const e=EV[+li.dataset.ev];jumpYear(e.t);card.querySelectorAll('li').forEach(x=>x.style.fontWeight='');li.style.fontWeight='700'});card.querySelectorAll('li[data-pe]').forEach(li=>li.onclick=()=>selectPerson(PE.find(p=>p.id===li.dataset.pe),+li.dataset.k))}
function selectCity(c){if(!c)return;clearInterval(autoT);sel={type:'city',c};if(yr<c.from||yr>c.to)jumpYear(clamp(yr,c.from,Math.min(c.to,T1)));flyTo(c.lon,c.lat,Math.max(view.s,34));
  const rows=traceRows(c.lon,c.lat,c);const nEv=rows.reduce((a,r)=>a+r.evs.length,0);
  openCard(cHead('溯源 · 城市沿革',esc(cityName(c,Math.max(c.from,T0)))+' · 今'+esc(modName(c)),'<span>'+c.lon.toFixed(2)+'°E, '+c.lat.toFixed(2)+'°N · 今属'+esc(c.mod||'—')+'</span><span class="badge o">战事 · '+nEv+'</span>')+
   '<div class="cb">'+(c.names.length>1?'<div class="bio"><b>名称沿革</b> · '+c.names.map(n=>esc(n[1])+'<span style="color:var(--muted)">（'+Math.floor(n[0])+'起）</span>').join(' → ')+'</div>':'')+rowsHTML(rows)+'</div>');
  bindTrace();setTimeout(()=>{const cur=card.querySelector('.tr.cur');if(cur)cur.scrollIntoView({block:'center'})},30);need=true}
function selectPass(p){sel={type:'pass',p};flyTo(p.lon,p.lat,Math.max(view.s,34));const rows=traceRows(p.lon,p.lat,null).filter(r=>r.evs.length||r.ps.length);
  openCard(cHead('要塞关隘',esc(p.n),(p.al?'<span>又称'+esc(p.al)+'</span>':'')+'<span>'+p.lon.toFixed(2)+'°E, '+p.lat.toFixed(2)+'°N</span>')+'<div class="cb"><p style="font:14.5px/1.8 var(--serif);margin:2px 0 10px">'+esc(p.d)+'</p>'+(rows.length?'<div class="sub">在此发生的战事</div>'+rowsHTML(rows):'')+'</div>');bindTrace();need=true}
function selectPoint(lon,lat){const c=nearCity(lon,lat,.3);if(c&&yr>=c.from){selectCity(c);return}
  sel={type:'point',lon,lat};const rows=traceRows(lon,lat,null);const nc=nearCity(lon,lat,3);
  openCard(cHead('溯源 · 此地归属','此地'+(nc?' · 近'+esc(modName(nc)):''),'<span>'+lon.toFixed(2)+'°E, '+lat.toFixed(2)+'°N</span>'+(nc?'<span>距'+esc(modName(nc))+'约'+Math.round(km(lon,lat,nc.lon,nc.lat))+'公里</span>':''))+'<div class="cb">'+(nc?'<button class="row" data-ci="'+nc.id+'"><b>最近的城市：'+esc(modName(nc))+'</b><span class="lk">溯源 ›</span></button>':'')+rowsHTML(rows)+'</div>');
  bindCardLinks();bindTrace();need=true}
/* ---------- 搜索 ---------- */
const SI=[];
for(const p of PE){SI.push({l:p.n,s:p.life+' · '+p.role,w:6,ex:[p.n,p.n.replace(/帝$/,'')],t:p.n+p.role+p.bio,a:()=>selectPerson(p,0)});p.stops.forEach((st,k)=>{if(st[5])SI.push({l:st[5].replace(/——.*/,''),s:p.n+' · '+fDS(st[6])+' · '+st[3],w:1,t:st[5],a:()=>selectPerson(p,k)})})}
for(const c of CI){const nm=[...new Set(c.names.map(n=>n[1]))];SI.push({l:nm.join(' / '),s:'城市 · 今'+modName(c)+' · '+c.mod,w:4,ex:nm.map(n=>n.replace(/（.*?）/g,'')).concat(nm),t:nm.join(' ')+c.mod,a:()=>selectCity(c)})}
for(const p of PA)SI.push({l:p.n,s:'要塞关隘'+(p.al?' · '+p.al:''),w:3,ex:[p.n,p.al],t:p.n+p.al,a:()=>selectPass(p)});
for(const e of EV)SI.push({l:e.n,s:fDS(e.ds)+' · '+KN[e.k],w:e.k==='M'?5:3,ex:[e.n],t:e.n+e.d,a:()=>selectEvent(e)});
const seenP=new Set();S.forEach(s=>{SI.push({l:s.era,s:'时期 · '+fYM(s.a)+'—'+fYM(s.b-.001),w:2,t:s.era+s.sn,a:()=>{jumpYear(s.at);flyBox(s.pol[0].info.b)}});s.pol.forEach(p=>{if(seenP.has(p.n))return;seenP.add(p.n);SI.push({l:p.n,s:'政权 · 始见于'+fYM(s.a),w:2,t:p.n,a:()=>{jumpYear(s.at);flyBox(p.info.b)}})})});
const q=$('#q'),sres=$('#sres');let sk=-1;
function doSearch(){const v=q.value.trim();sk=-1;if(!v){sres.hidden=true;return}const sc=x=>(x.ex&&x.ex.includes(v)?100:0)+(x.l.startsWith(v)?50:0)+(x.l.includes(v)?20:0)+x.w;let r=[];
  const m=v.match(/^(\d{4})(?:\s*[-./年]\s*(\d{1,2}))?/);if(m){const tt=T(v);if(tt>=T0&&tt<=T1+1)r.push({l:'跳到 '+(m[2]?m[1]+'年'+(+m[2])+'月':m[1]+'年'),s:dateLine(tt,true),a:()=>jumpYear(tt)})}
  r=r.concat(SI.filter(x=>x.l.includes(v)||x.t.includes(v)).sort((a,b)=>sc(b)-sc(a)).slice(0,14));
  sres.innerHTML=r.length?r.map((x,i)=>'<button data-i="'+i+'"><b>'+esc(x.l.length>24?x.l.slice(0,24)+'…':x.l)+'</b><small>'+esc(x.s)+'</small></button>').join(''):'<div class="empty">没有找到“'+esc(v)+'”。可以试试：蒋介石、平型关、汉城、上甘岭、1950-10</div>';sres.hidden=false;sres._r=r}
q.addEventListener('input',doSearch);q.addEventListener('focus',doSearch);
q.addEventListener('keydown',e=>{const bs=sres.querySelectorAll('button');if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!bs.length)return;sk=(sk+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length;bs.forEach((b,i)=>b.classList.toggle('k',i===sk))}else if(e.key==='Enter'){const r=sres._r||[];const x=r[sk>=0?sk:0];if(x){x.a();sres.hidden=true;q.blur()}}else if(e.key==='Escape'){sres.hidden=true;q.blur()}});
sres.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sres._r[+b.dataset.i].a();sres.hidden=true;q.blur()});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search'))sres.hidden=true;if(!e.target.closest('#layers')&&!e.target.closest('#bLayers'))$('#layers').hidden=true});
/* ---------- 舆图寻址 ---------- */
const RANKS=[[960,'大元帅','运筹帷幄，决胜千里：每一处战场都了然于胸。'],[900,'元帅','百战名将，烽烟所至无不熟稔。'],[840,'上将','统兵一方，舆图在握。'],[780,'中将','久经战阵，偶有数十里之差。'],[720,'少将','方面军参谋长的水准。'],[650,'上校','团长读图，八九不离十。'],[580,'中校','大方向不错，细处还需推敲。'],[500,'少校','能找到大战场，偏远战事还需再看。'],[420,'上尉','连长级读图，多走几遍时间轴吧。'],[340,'中尉','熟悉几场大战役。'],[260,'少尉','初出军校。'],[180,'上士','跟着地图再走一遍。'],[100,'中士','新兵连毕业。'],[0,'列兵','从鸦片战争开始，慢慢看。']];
function startQuiz(){closeCard();stopPlay();const pool=D.QZ.map(n=>EV.find(e=>e.n===n)).filter(Boolean);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  quiz={pv:panel.hidden,qs:pool.slice(0,10),i:0,score:0,pin:null,rev:false};$('#bQuiz').classList.add('on');$('#sbox').hidden=true;panel.hidden=true;$('#bPanel').classList.remove('on');$('#legend').classList.add('min');renderLegend();nextQ(true)}
function nextQ(first){const e=quiz.qs[quiz.i];quiz.cur=e;quiz.pin=null;quiz.rev=false;$('#qok').hidden=true;jumpYear(e.t,first?700:900);const wide=e.lon>140||e.lat<10;const f=wide?fitBox(95,my(-10),205,my(48),20):fitBox(96,my(17),136,my(50),20);anim.v={t0:performance.now(),f:{cx:view.cx,cy:view.cy,s:view.s},to:f,dur:800};renderQuiz();need=true}
function renderQuiz(){const Z=$('#quiz');Z.hidden=false;const e=quiz.cur;
  if(quiz.done){const r=RANKS.find(r=>quiz.score>=r[0]);Z.innerHTML='<div class="qh"><span class="badge">舆图寻址</span><span class="badge o">十题已毕</span><span class="sc">总分 '+quiz.score+' / 1000</span></div><div style="font:13px var(--serif);color:var(--muted);margin-top:6px">授予军衔</div><div class="rank">'+esc(r[1])+'</div><div style="font:13.5px var(--serif);color:var(--ink2)">'+esc(r[2])+'</div><div class="qa"><button class="btn pri" id="qAg">再来一局</button><button class="btn" id="qX">返回地图</button></div>';$('#qAg').onclick=startQuiz;$('#qX').onclick=endQuiz;return}
  Z.innerHTML='<div class="qh"><span class="badge">舆图寻址</span><span class="badge o">第 '+(quiz.i+1)+' / 10 题</span><span class="sc">得分 '+quiz.score+'</span><button class="cx" style="position:static" id="qX" aria-label="退出">×</button></div>'+
   '<div class="qp">请在地图上标出「<em>'+esc(e.n)+'</em>」的发生地</div><div class="qt"><span>线索</span>'+esc(fDS(e.ds)+' · '+KN[e.k]+(quiz.rev?' · '+e.d:''))+'</div>'+
   (quiz.rev?'<div class="qr">'+(quiz.pin?'偏差约 <b>'+Math.round(quiz.d)+'</b> 公里，本题得 <b>'+quiz.last+'</b> 分。':'未落针，本题 0 分。')+'</div><div class="qa"><button class="btn pri" id="qN">'+(quiz.i>=9?'看总分 →':'下一题 →')+'</button><button class="btn" id="qC">查看战事</button></div>':'<div class="qr" style="color:var(--muted)">在地图上点一下落针，再点「确认落针」。城市与战役标注已隐去。</div>');
  $('#qX').onclick=endQuiz;if(quiz.rev){$('#qN').onclick=()=>{if(quiz.i>=9){quiz.done=true;renderQuiz();need=true;return}quiz.i++;nextQ()};$('#qC').onclick=()=>{const ev=e;endQuiz();selectEvent(ev)}}}
function confirmQ(){if(!quiz||quiz.rev||!quiz.pin)return;const e=quiz.cur;const d=km(quiz.pin[0],quiz.pin[1],e.lon,e.lat);quiz.d=d;const s=d<=30?100:Math.max(0,Math.round(100-100*Math.log(d/30)/Math.log(50)));quiz.last=s;quiz.score+=s;quiz.rev=true;$('#qok').hidden=true;renderQuiz();flyTo(e.lon,e.lat,Math.max(view.s,24));need=true}
function endQuiz(){if(quiz&&!quiz.pv&&!isMob()){panel.hidden=false;$('#bPanel').classList.add('on')}quiz=null;$('#quiz').hidden=true;$('#qok').hidden=true;$('#sbox').hidden=false;$('#bQuiz').classList.remove('on');$('#legend').classList.toggle('min',isMob());renderLegend();need=true}
$('#bQuiz').onclick=()=>quiz?endQuiz():startQuiz();$('#qok').onclick=confirmQ;
/* ---------- 地图交互 ---------- */
const ptrs=new Map();let moved=0,pinchD=0;
const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);const p=pos(e);ptrs.set(e.pointerId,{x:p[0],y:p[1]});moved=0;anim.v=null;cv.classList.add('drag');if(ptrs.size===2){const a=[...ptrs.values()];pinchD=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
cv.addEventListener('pointermove',e=>{const p=pos(e);const o=ptrs.get(e.pointerId);if(!o){hoverAt(p[0],p[1]);return}
  if(ptrs.size===1){const dx=p[0]-o.x,dy=p[1]-o.y;moved+=Math.abs(dx)+Math.abs(dy);view.cx-=dx/view.s;view.cy+=dy/view.s;clampView();viewVer++;need=true;hideTip()}
  else if(ptrs.size===2){o.x=p[0];o.y=p[1];const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchD>0)zoomAt((a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2,d/pinchD);pinchD=d;moved+=10;return}
  o.x=p[0];o.y=p[1]});
function endPtr(e){const had=ptrs.delete(e.pointerId);cv.classList.remove('drag');pinchD=0;if(had&&moved<6&&ptrs.size===0){const p=pos(e);clickAt(p[0],p[1])}}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);cv.classList.remove('drag')});
cv.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);zoomAt(p[0],p[1],Math.exp(-e.deltaY*.0016))},{passive:false});
cv.addEventListener('dblclick',e=>{const p=pos(e);zoomAt(p[0],p[1],1.7)});
function hitAt(x,y){let b=null,bd=1e9;for(const h of hits){const d=Math.hypot(h.x-x,h.y-y);if(d<=h.r&&d<bd){bd=d;b=h}}return b}
function clickAt(x,y){if(quiz){if(quiz.rev||quiz.done)return;const [lon,mY]=s2w(x,y);quiz.pin=[lon,iy(mY)];need=true;return}
  const h=hitAt(x,y);if(h){if(h.e)selectEvent(h.e);else if(h.stop!=null)goStop(h.stop);else if(h.force!=null)selectForce(domIdx,h.force);else if(h.city)selectCity(h.city);else if(h.pass)selectPass(h.pass);return}
  const [lon,mY]=s2w(x,y);ctx.setTransform(1,0,0,1,0,0);if(!ctx.isPointInPath(landPath,lon,mY))return;selectPoint(lon,iy(mY))}
const tip=$('#tip');
function showTip(x,y,html){tip.innerHTML=html;tip.style.display='block';const w=tip.offsetWidth;tip.style.left=clamp(x+14,4,W-w-4)+'px';tip.style.top=clamp(y-34,4,H-30)+'px'}
function hideTip(){tip.style.display='none'}
let hovRaf=0;
function hoverAt(x,y){if(hovRaf)return;hovRaf=requestAnimationFrame(()=>{hovRaf=0;const h=hitAt(x,y);const t=yr;
  if(h){cv.style.cursor='pointer';if(h.e)showTip(x,y,'<b>'+fDS(h.e.ds)+'</b>'+esc(h.e.n));else if(h.force!=null){const f=S[domIdx].fo[h.force];showTip(x,y,'<b>'+esc(f[0])+'</b>'+esc(f[6]))}else if(h.city){const cp=capAt(h.city,t);showTip(x,y,'<b>'+esc(cityName(h.city,t))+'</b>'+(cp?esc(cp[2])+' · ':'')+'今'+esc(modName(h.city))+' · 点击溯源')}else if(h.pass)showTip(x,y,'<b>'+esc(h.pass.n)+'</b>要塞关隘');else if(h.stop!=null){const s=sel.p.stops[h.stop];showTip(x,y,'<b>'+s[6].slice(0,7)+'</b>'+esc(s[3]))}return}
  cv.style.cursor='';if(quiz){hideTip();return}const [lon,mY]=s2w(x,y);ctx.setTransform(1,0,0,1,0,0);let p=null;for(const q of S[domIdx].pol)if(ctx.isPointInPath(q.path,lon,mY))p=q;if(p)showTip(x,y,'<b>'+esc(p.n)+'</b>点击查看此地归属沿革');else hideTip()})}
cv.addEventListener('pointerleave',hideTip);
$('#zi').onclick=()=>zoomAt(W/2,H/2,1.5);$('#zo').onclick=()=>zoomAt(W/2,H/2,1/1.5);$('#zr').onclick=()=>{anim.v={t0:performance.now(),f:{cx:view.cx,cy:view.cy,s:view.s},to:HOME(),dur:700}};
$('#bLayers').onclick=()=>{const L=$('#layers');L.hidden=!L.hidden;$('#bLayers').setAttribute('aria-expanded',String(!L.hidden))};
document.querySelectorAll('#layers input').forEach(i=>{i.checked=!!opt[i.dataset.o];i.onchange=()=>{opt[i.dataset.o]=i.checked;need=true}});
$('#bPanel').onclick=()=>{panel.hidden=!panel.hidden;$('#bPanel').classList.toggle('on',!panel.hidden);need=true};
document.addEventListener('keydown',e=>{const tg=e.target.tagName;if(tg==='INPUT')return;
  if(quiz&&e.key==='Enter'){confirmQ();return}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const d=e.key==='ArrowRight'?1:-1;if(e.shiftKey){stepM(d*12);return}
    if(sel&&sel.type==='person'){goStop(sel.k+d);return}const e2=d>0?EV.find(v=>v.t>yr+.003):[...EV].reverse().find(v=>v.t<yr-.003);if(e2)selectEvent(e2)}
  else if(e.key===' '){e.preventDefault();$('#play').click()}else if(e.key==='/'){e.preventDefault();q.focus()}else if(e.key==='Escape'){if(quiz)endQuiz();else if(panel.classList.contains('carding'))closeCard()}});
/* ---------- 尺寸 ---------- */
function resize(){const r=cv.getBoundingClientRect();W=Math.max(300,r.width);H=Math.max(200,r.height);dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);sizeLayers();clampView();viewVer++;buildTrack();lastYS='';need=true;$('#mapctl').style.right=(panelW()?panelW()+14:14)+'px'}
let first=true;
new ResizeObserver(()=>{resize();if(first){first=false;if(isMob()){panel.hidden=true;$('#bPanel').classList.remove('on');$('#legend').classList.add('min')}fitAll()}}).observe(cv);
new MutationObserver(()=>{$('#mapctl').style.right=(panelW()?panelW()+14:14)+'px'}).observe(panel,{attributes:true,attributeFilter:['hidden']});
/* ---------- 录屏 ---------- */
const REC={on:false,mode:'manual',t0:0,chunks:[],mr:null,cv:null,raf:0,dir:null,mem:[]};
const idb=new Promise(res=>{try{const q=indexedDB.open('fhyt-rec',1);q.onupgradeneeded=()=>{q.result.createObjectStore('rec',{keyPath:'id',autoIncrement:true});q.result.createObjectStore('meta')};q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)}catch(e){res(null)}});
const idbDo=async(st,mode,fn)=>{const d=await idb;if(!d)return null;return new Promise(r=>{try{const tx=d.transaction(st,mode),rq=fn(tx.objectStore(st));tx.oncomplete=()=>r(rq&&rq.result);tx.onerror=()=>r(null);tx.onabort=()=>r(null)}catch(e){r(null)}})};
const pad2=n=>String(n).padStart(2,'0');
const fmtDur=s=>pad2(Math.floor(s/60))+':'+pad2(Math.floor(s%60));
const fmtSz=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
function recMime(){for(const m of ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4;codecs=avc1','video/mp4'])try{if(MediaRecorder.isTypeSupported(m))return m}catch(e){}return''}
function recHud(c,x,w,h){const k=w/Math.max(1,cv.clientWidth);x.save();x.setTransform(1,0,0,1,0,0);x.scale(k,k);const W2=w/k,H2=h/k;const SF='"Noto Serif SC","Songti SC","STSong","SimSun",serif';
  const dom=Math.max(0,domIdx),st=S[dom];
  // 底部：日期 + 时期
  const line=(htip.textContent||'');x.font='700 22px '+SF;const lw=x.measureText(line).width;x.font='600 14px '+SF;const sn=(st&&st.sn)||'';const sw=x.measureText(sn).width;const bw=Math.max(lw,sw)+40,bx=(W2-bw)/2,by=H2-86;
  x.fillStyle='rgba(43,38,34,.78)';rrect(bx,by,bw,62,12);x.fill();x.textAlign='center';x.textBaseline='alphabetic';x.fillStyle='#fff';x.font='700 22px '+SF;x.fillText(line,W2/2,by+28);x.fillStyle='#f0c9b8';x.font='600 14px '+SF;x.fillText(sn,W2/2,by+50);
  // 时间进度
  x.fillStyle='rgba(255,255,255,.25)';x.fillRect(0,H2-6,W2,6);x.fillStyle='#e5412d';x.fillRect(0,H2-6,W2*xOf(yr),6);
  // 左下：政权图例
  if(st){let ly=H2-20;x.textAlign='left';x.font='600 14px '+SF;const ps=st.pol.slice(0,8);const hh=ps.length*22+12;x.fillStyle='rgba(251,248,241,.9)';let mw=0;ps.forEach(p=>mw=Math.max(mw,x.measureText(p.n).width));rrect(12,H2-24-hh,mw+50,hh,8);x.fill();ps.forEach((p,i)=>{const yy=H2-24-hh+8+i*22;x.fillStyle=p.fl;x.fillRect(22,yy+2,16,14);x.strokeStyle=p.dk;x.lineWidth=1;x.strokeRect(22,yy+2,16,14);x.fillStyle='#2b2622';x.textBaseline='middle';x.fillText(p.n,46,yy+10)})}
  // 顶部：人物/事件字幕
  const cp=$('#cap');if(cp&&!cp.hidden&&cp.offsetParent&&cp.textContent.trim()){const tx=cp.textContent.trim().replace(/\s+/g,' ');x.font='600 17px '+SF;x.textBaseline='alphabetic';const mw2=Math.min(W2-60,760);const words=[...tx];const ls=[];let cur='';for(const ch of words){if(x.measureText(cur+ch).width>mw2-30){ls.push(cur);cur=ch}else cur+=ch}ls.push(cur);const L=ls.slice(0,3);const hh=L.length*24+16;x.fillStyle='rgba(43,38,34,.8)';rrect((W2-mw2)/2,14,mw2,hh,10);x.fill();x.fillStyle='#fff';x.textAlign='left';L.forEach((l,i)=>x.fillText(l,(W2-mw2)/2+15,38+i*24))}
  x.textAlign='right';x.font='600 14px '+SF;x.fillStyle='rgba(43,38,34,.6)';x.textBaseline='alphabetic';x.fillText('烽火舆图',W2-14,H2-16);x.restore()}
function recLoop(){if(!REC.on)return;const c=REC.cv,x=c.getContext('2d');x.drawImage(cv,0,0,c.width,c.height);recHud(c,x,c.width,c.height);
  $('#recT').textContent=fmtDur((performance.now()-REC.t0)/1000);
  // 自动模式结束条件
  const m=REC.mode;if(!REC.endAt){if(m==='timeline'&&!playing)REC.endAt=performance.now()+1500;else if(m==='stage'&&(!playing||yr>=REC.stageEnd-.01)){stopPlay();REC.endAt=performance.now()+1500}else if(m==='person'&&!(sel&&sel.type==='person'&&sel.auto)&&performance.now()-REC.t0>1500)REC.endAt=performance.now()+3000}
  else if(performance.now()>REC.endAt){recStop();return}
  REC.raf=requestAnimationFrame(recLoop)}
async function recStart(mode){if(REC.on)return;if(!window.MediaRecorder||!cv.captureStream){toast('当前浏览器不支持录屏（需要 MediaRecorder）');return}
  const sc=Math.min(1,1920/(cv.width||1));const c=document.createElement('canvas');c.width=Math.round(cv.width*sc);c.height=Math.round(cv.height*sc);REC.cv=c;
  const mime=recMime();let mr;try{mr=new MediaRecorder(c.captureStream(30),mime?{mimeType:mime,videoBitsPerSecond:6e6}:{videoBitsPerSecond:6e6})}catch(e){toast('无法开始录制');return}
  REC.mr=mr;REC.chunks=[];REC.mime=mr.mimeType||mime||'video/webm';mr.ondataavailable=e=>{if(e.data&&e.data.size)REC.chunks.push(e.data)};mr.onstop=recSave;
  REC.mode=mode;REC.endAt=0;REC.on=true;REC.t0=performance.now();mr.start(1000);$('#recpill').hidden=false;$('#bRec').classList.add('on');$('#recmenu').hidden=true;
  if(mode==='timeline'){if(yr>=T1-.05)yr=T0;playing=true;$('#play').innerHTML=PAUSE;need=true}
  else if(mode==='stage'){const s0=S[Math.max(0,domIdx)];REC.stageEnd=s0.b;yr=s0.a+.001;playing=true;$('#play').innerHTML=PAUSE;need=true}
  else if(mode==='person'){if(!(sel&&sel.type==='person')){recStop();toast('请先在「人物」里选一位人物');return}sel.auto=false;toggleAuto()}
  recLoop()}
function recStop(){if(!REC.on)return;REC.on=false;cancelAnimationFrame(REC.raf);$('#recpill').hidden=true;$('#bRec').classList.remove('on');try{REC.mr.stop()}catch(e){}}
async function recSave(){const dur=(performance.now()-REC.t0)/1000;const blob=new Blob(REC.chunks,{type:REC.mime});const ext=/mp4/.test(REC.mime)?'mp4':'webm';const d=new Date();
  const name='烽火舆图_'+d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+'_'+pad2(d.getHours())+pad2(d.getMinutes())+pad2(d.getSeconds())+'.'+ext;
  const item={name,ts:Date.now(),dur,size:blob.size,mime:REC.mime,blob};const id=await idbDo('rec','readwrite',s=>s.add(item));if(id==null)REC.mem.push(item);
  let saved='';const dh=await getDir();if(dh){try{if(await dh.requestPermission({mode:'readwrite'})==='granted'){const fh=await dh.getFileHandle(name,{create:true});const w=await fh.createWritable();await w.write(blob);await w.close();saved='，并已写入你选择的文件夹「'+dh.name+'」'}}catch(e){}}
  toast('录像已保存到「录像库」'+saved+'（'+fmtDur(dur)+'，'+fmtSz(blob.size)+'）',6000);if(!$('#reclib').hidden)recLib()}
async function getDir(){if(REC.dir)return REC.dir;const h=await idbDo('meta','readonly',s=>s.get('dir'));return REC.dir=h||null}
let toastT=0;function toast(m,ms){let t=$('#rtoast');if(!t){t=document.createElement('div');t.id='rtoast';t.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(43,38,34,.94);color:#fff;padding:9px 16px;border-radius:10px;font-size:13px;z-index:80;max-width:90vw;text-align:center';document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,ms||3000)}
async function recAll(){const a=(await idbDo('rec','readonly',s=>s.getAll()))||[];return a.concat(REC.mem).sort((u,v)=>v.ts-u.ts)}
async function exportRec(it){const dh=await getDir();try{if(window.showSaveFilePicker){const fh=await showSaveFilePicker({suggestedName:it.name});const w=await fh.createWritable();await w.write(it.blob);await w.close();toast('已导出');return}}catch(e){if(e&&e.name==='AbortError')return}
  const u=URL.createObjectURL(it.blob),a=document.createElement('a');a.href=u;a.download=it.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),8000);toast('已请求下载；若无反应，请在录像库里回放，或用本地 / GitHub Pages 页面打开后导出',5000)}
async function recLib(){const L=$('#reclib');L.hidden=false;const items=await recAll();const dh=await getDir();
  L.querySelector('.bd').innerHTML='<div class="tip">录像保存在本浏览器的「录像库」里，可随时回放。想存到方便查阅的文件夹：点「选择保存文件夹」（Chrome / Edge），之后每次录完会自动写入该文件夹；也可对单个录像点「导出」。当前文件夹：<b>'+(dh?dh.name:'未设置')+'</b></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="rDir">选择保存文件夹</button></div><div id="rPlayer"></div>'+(items.length?items.map((it,i)=>'<div class="it"><b>'+it.name+'</b><span>'+fmtDur(it.dur)+' · '+fmtSz(it.size)+'</span><button class="btn pri" data-a="p" data-i="'+i+'">回放</button><button class="btn" data-a="e" data-i="'+i+'">导出</button><button class="btn" data-a="d" data-i="'+i+'">删除</button></div>').join(''):'<div class="tip">还没有录像。点右上角「录屏」开始。</div>');
  $('#rDir').onclick=async()=>{if(!window.showDirectoryPicker){toast('此浏览器/环境不支持选择文件夹，请用「导出」',4000);return}try{const h=await showDirectoryPicker({mode:'readwrite'});REC.dir=h;await idbDo('meta','readwrite',s=>s.put(h,'dir'));toast('已设置保存文件夹：'+h.name);recLib()}catch(e){}};
  L.querySelectorAll('[data-a]').forEach(b=>b.onclick=async()=>{const it=items[+b.dataset.i],a=b.dataset.a;if(a==='p'){const u=URL.createObjectURL(it.blob);const P=$('#rPlayer');if(P._u)URL.revokeObjectURL(P._u);P._u=u;P.innerHTML='<video controls autoplay playsinline src="'+u+'"></video>';P.scrollIntoView({block:'nearest'})}else if(a==='e')exportRec(it);else if(a==='d'){if(it.id!=null)await idbDo('rec','readwrite',s=>s.delete(it.id));else REC.mem=REC.mem.filter(m=>m!==it);recLib()}})}
(function(){const m=document.createElement('div');m.id='recmenu';m.hidden=true;m.innerHTML='<button data-m="manual">● 开始录制<small>之后你自己操作：播放、点战役、走人物路线</small></button><button data-m="timeline">▶ 录制时间轴自动播放<small>从当前时刻放到 1979 年，放完自动停止</small></button><button data-m="stage">▶ 录制当前时期自动播放<small>适合单场战役：从本时期起点放到终点</small></button><button data-m="person">▶ 录制当前人物「走一遍」<small>需先选中一位人物，走完自动停止</small></button><hr><button data-m="lib">▣ 录像库（回放 / 导出 / 保存位置）</button>';$('header').appendChild(m);
  const p=document.createElement('div');p.id='recpill';p.hidden=true;p.innerHTML='<i></i><span>录制中 <b id="recT">00:00</b></span><button id="recStop">停止</button>';document.querySelector('main').appendChild(p);
  const L=document.createElement('div');L.id='reclib';L.hidden=true;L.innerHTML='<div class="box"><div class="hd"><span>录像库</span><button class="btn" id="rClose">关闭</button></div><div class="bd"></div></div>';document.body.appendChild(L);
  $('#rClose').onclick=()=>{L.hidden=true;L.querySelectorAll('video').forEach(v=>v.pause())};L.addEventListener('pointerdown',e=>{if(e.target===L)$('#rClose').onclick()});
  $('#bRec').onclick=()=>{if(REC.on){recStop();return}m.hidden=!m.hidden};$('#recStop').onclick=recStop;
  m.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.dataset.m;m.hidden=true;if(k==='lib')recLib();else recStart(k)});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#recmenu')&&!e.target.closest('#bRec'))m.hidden=true})})();
window.__cw={get yr(){return yr},jump:t=>{yr=typeof t==='string'?T(t):t;need=true},city:id=>selectCity(CIx[id]),person:(id,k)=>selectPerson(PE.find(p=>p.id===id),k||0),stop:k=>goStop(k),event:n=>selectEvent(typeof n==='number'?EV[n]:EV.find(e=>e.n===n)),quiz:()=>startQuiz(),pin:(lon,lat)=>{quiz.pin=[lon,lat];need=true},confirm:()=>confirmQ(),view,hi:j=>{hiPol=j;need=true},hf:k=>{hiFo=k;need=true},S,EV,CI,PE,fly:(lon,lat,s)=>{Object.assign(view,{cx:lon,cy:my(lat),s});clampView();viewVer++;need=true}};
requestAnimationFrame(loop);
})();
