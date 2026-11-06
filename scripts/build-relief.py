# 由 NASA 高程凹凸图生成墨卡托投影的地形晕渲底图（与地图 BB 对齐）
import numpy as np, math, os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
from PIL import Image, ImageFilter
src=np.asarray(Image.open(os.path.join(ROOT,'raw','elev_bump_4k.jpg')).convert('L'),dtype=np.float32)
SH,SW=src.shape
X0,X1,LA0,LA1=68,205,-13,56
my=lambda la: math.log(math.tan(math.pi/4+la*math.pi/360))*180/math.pi
Y0,Y1=my(LA0),my(LA1)
os.makedirs(os.path.join(ROOT,'build'),exist_ok=True)
OW=2000; OH=int(round(OW*(Y1-Y0)/(X1-X0)))
xs=np.linspace(X0,X1,OW); ys=np.linspace(Y1,Y0,OH)
lat=np.degrees(2*np.arctan(np.exp(np.radians(ys)))-np.pi/2)
px=(((xs+180)%360)/360*SW); py=(90-lat)/180*SH
# 双线性采样
def samp(a,px,py):
  X,Yy=np.meshgrid(px,py); x0=np.floor(X).astype(int); y0=np.floor(Yy).astype(int)
  fx=X-x0; fy=Yy-y0; x1=np.clip(x0+1,0,SW-1); y1=np.clip(y0+1,0,SH-1)
  return (a[y0,x0]*(1-fx)*(1-fy)+a[y0,x1]*fx*(1-fy)+a[y1,x0]*(1-fx)*fy+a[y1,x1]*fx*fy)
z=samp(src,px,py)
k=np.array([1,4,6,4,1],np.float32);k/=k.sum()
z=np.apply_along_axis(lambda r:np.convolve(r,k,mode='same'),1,z)
z=np.apply_along_axis(lambda r:np.convolve(r,k,mode='same'),0,z)
e=(z/255.0)**1.15*7000.0  # 近似高程（米）
cell=(X1-X0)/OW*111000*0.85
gy,gx=np.gradient(e,cell)
ex=9.0
slope=np.arctan(ex*np.hypot(gx,gy)); asp=np.arctan2(-gx,gy)
az,alt=math.radians(315),math.radians(40)
hs=np.sin(alt)*np.cos(slope)+np.cos(alt)*np.sin(slope)*np.cos(az-asp)
hs=np.clip(hs,0,1)
flat=math.sin(alt)
# 以平地为基准：亮于平地→提亮，暗于平地→压暗
d=hs-flat
# 高程着色：低地沙黄 → 高地灰褐
t=np.clip(e/4200.0,0,1)[...,None]
low=np.array([236,226,203],np.float32); mid=np.array([214,198,168],np.float32); high=np.array([196,186,170],np.float32)
col=np.where(t<0.45, low+(mid-low)*(t/0.45), mid+(high-mid)*((t-0.45)/0.55))
shade=1+np.clip(d,-1,1)[...,None]*np.where(d[...,None]<0,1.05,0.55)
rgb=np.clip(col*shade,0,255).astype(np.uint8)
Image.fromarray(rgb).save(os.path.join(ROOT,'build','relief.webp'),quality=72,method=6)
print(OW,OH)
