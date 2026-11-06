# 打包单文件 index.html：页面骨架 + 几何 + 史料 + 地形图 + 应用脚本
import base64, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
p = lambda *a: os.path.join(ROOT, *a)
head = open(p('src', 'head.html'), encoding='utf-8').read()
app = open(p('src', 'app.js'), encoding='utf-8').read()
g = open(p('build', 'geo.json'), encoding='utf-8').read()
d = open(p('build', 'data.json'), encoding='utf-8').read()
r = base64.b64encode(open(p('build', 'relief.webp'), 'rb').read()).decode()
out = head + '\n<script>window.GEO=' + g + ';</script>\n<script>window.DATA=' + d + ';</script>\n<script>window.RELIEF="data:image/webp;base64,' + r + '";</script>\n<script>\n' + app + '\n</script>\n'
open(p('index.html'), 'w', encoding='utf-8').write(out)
print('index.html', len(out.encode()) // 1024, 'KB')
