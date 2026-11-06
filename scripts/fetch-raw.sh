#!/usr/bin/env bash
# 下载构建所需的原始地理数据到 raw/（Natural Earth 公有领域数据、NASA 高程图）
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p raw
NE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
for f in ne_10m_admin_1_states_provinces ne_10m_rivers_lake_centerlines ne_10m_lakes ne_10m_geography_regions_polys; do
  [ -f raw/$f.geojson ] || curl -fSL -o raw/$f.geojson $NE/$f.geojson
done
[ -f raw/elev_bump_4k.jpg ] || curl -fSL -o raw/elev_bump_4k.jpg https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg
echo "raw data ready"
