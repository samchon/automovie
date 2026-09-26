# 모델 part와 재료 결속

## 결속 키와 반복 길이 {#binding-map}

2026-09-25 사용자의 절차 생성 텍스처 지시에 따라 각 모델 part를 한 재료 결속 키에 배정한다. 이 문서가 결속 키, UV0 미터 좌표에 적용할 반복 길이, 비트맵 부재 시 단색 fallback, part 배정을 소유한다. 색은 sRGB이며 비트맵을 읽지 못해도 geometry가 낸 유한한 UV0를 검증한다. 모델의 UV0 투영과 이음은 [축척 기준](../models/scale.md#reference-scale)이 소유한다.

| 결속 키 | 반복 길이 U·V (m) | 비트맵 부재 시 단색 fallback |
| --- | --- | --- |
| `limestone` | 1.00·1.00 | `#c9c0ad` |
| `dark-metal` | 0.18·0.18 | `#574b39` |
| `dark-wood` | 1.00·1.00 | `#795339` |
| `terracotta` | 0.22·0.22 | `#9a684b` |
| `roof-terracotta` | 0.50·0.50 | `#874b38` |
| `wicker` | 0.11·0.11 | `#a58658` |
| `parchment` | 0.16·0.16 | `#c6aa77` |
| `linen` | 0.25·0.25 | `#8a7564` |
| `rope-fibre` | 0.10·0.10 | `#96805c` |
| `soil` | 0.25·0.25 | `#8c795c` |
| `water` | 0.50·0.50 | `#668b91` |
| `foliage` | 0.28·0.28 | `#526448` |
| `plaster` | 1.50·1.50 | `#cdb68e` |

각 행의 part 목록은 해당 모델 H2가 방출하는 part 표면이다. 같은 part는 정확히 하나의 키를 쓴다. 봉헌 그릇의 도기 변형은 같은 `bowl` 표면과 UV0를 유지하고 금속 대신 도기 결속을 택한다. 궤의 작은 문서 상자 변형과 직물의 폭·깊이·두께 변형도 표면 ID와 UV0 미터 단위를 유지한다.

| 모델 H2 | part 표면 | 결속 키 |
| --- | --- | --- |
| `columns#colonnade-column`, `columns#porch-column` | `plinth`, `base`, `shaft`, `capital` | `limestone` |
| `entablature#colonnade-beam`, `entablature#rafter`, `entablature#ceiling-joist` | `timber` | `dark-wood` |
| `entablature#porch-entablature` | `beam`, `cornice`, `raking-trim` | `limestone` |
| `entablature#sanctuary-truss` | `tie-beam`, `principal`, `king-post`, `strut` | `dark-wood` |
| `openings#door-frame`, `openings#window-frame` | `lining`, `surround` | `limestone` |
| `openings#double-door-leaf` | `frame`, `panel` | `dark-wood` |
| `openings#double-door-leaf` | `plate`, `pin`, `ring`, `hinge` | `dark-metal` |
| `openings#single-door-leaf` | `board`, `batten` | `dark-wood` |
| `openings#single-door-leaf` | `strap`, `pin`, `ring` | `dark-metal` |
| `cladding#roof-tile` | `tegula`, `imbrex` | `roof-terracotta` |
| `cladding#ridge-tile` | `ridge` | `roof-terracotta` |
| `fixtures#fountain` | `step`, `rim`, `basin-inner`, `nozzle` | `limestone` |
| `fixtures#fountain` | `water`, `ripple`, `jet` | `water` |
| `fixtures#altar` | `step`, `top`, `support` | `limestone` |
| `fixtures#niche` | `plinth`, `body`, `recess-frame`, `recess`, `cap` | `limestone` |
| `fixtures#lampstand` | `foot`, `stem`, `knop`, `dish` | `dark-metal` |
| `fixtures#offering-table` | `top`, `trestle` | `limestone` |
| `fixtures#display-shelf` | `side`, `board` | `dark-wood` |
| `fixtures#desk` | `top`, `leg`, `stretcher` | `dark-wood` |
| `fixtures#stool` | `seat`, `leg`, `stretcher` | `dark-wood` |
| `fixtures#scroll-shelf` | `frame`, `board`, `divider` | `dark-wood` |
| `fixtures#chest` | `body`, `lid` | `dark-wood` |
| `fixtures#chest` | `hasp`, `strap` | `dark-metal` |
| `wares#storage-jar`, `wares#carry-jar`, `wares#small-vessel` | `body`, `handle` | `terracotta` |
| `wares#offering-bowl` | `bowl` | `dark-metal` |
| `wares#basket` | `wall`, `rim`, `floor` | `wicker` |
| `wares#scroll` | `sheet`, `sheet-1`, `sheet-2`, `sheet-3` | `parchment` |
| `wares#scroll` | `tie` | `rope-fibre` |
| `portable#bench` | `seat`, `pier` | `limestone` |
| `portable#portable-lamp` | `foot`, `stem`, `dish` | `dark-metal` |
| `portable#jar-rack` | `top`, `leg`, `well` | `dark-wood` |
| `portable#carrying-yoke` | `beam` | `dark-wood` |
| `portable#carrying-yoke` | `hook` | `dark-metal` |
| `portable#handcart` | `deck`, `handle`, `support` | `dark-wood` |
| `portable#handcart` | `axle`, `wheel` | `dark-wood` |
| `portable#bucket` | `body`, `handle` | `terracotta` |
| `portable#planter` | `pot` | `terracotta` |
| `portable#planter` | `soil` | `soil` |
| `portable#votive-plaque` | `base`, `slab` | `limestone` |
| `portable#offering-tray` | `floor`, `rim` | `dark-metal` |
| `portable#textile` | `cloth` | `linen` |
| `portable#stylus` | `shaft`, `tip` | `dark-metal` |
| `portable#writing-tablet` | `frame` | `dark-wood` |
| `portable#writing-tablet` | `writing-face` | `parchment` |
| `portable#rope-coil` | `rope`, `tie` | `rope-fibre` |
| `ritual#censer` | `foot`, `stem`, `cup` | `dark-metal` |
| `ritual#censer` | `ash`, `incense` | `soil` |
| `ritual#floor-cushion` | `base`, `pad`, `fold` | `linen` |
| `ritual#jar-stand` | `foot`, `post`, `ring` | `limestone` |
| `landscape#cypress` | `trunk` | `dark-wood` |
| `landscape#cypress` | `crown` | `foliage` |
| `landscape#broad-tree` | `trunk`, `branch` | `dark-wood` |
| `landscape#broad-tree` | `crown` | `foliage` |
| `landscape#grass-tuft` | `blade` | `foliage` |
| `landscape#neighbor-house` | `wall`, `recess` | `plaster` |
| `landscape#neighbor-house` | `plinth` | `limestone` |
| `landscape#neighbor-house` | `roof` | `roof-terracotta` |
