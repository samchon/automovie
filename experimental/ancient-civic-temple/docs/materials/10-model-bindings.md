# 모델 part와 재료 결속

## 결속 키와 반복 길이 {#binding-map}

2026-09-25 사용자의 절차 생성 텍스처 지시에 따라 각 모델 part를 한 재료 결속 키에 배정한다. 이 표가 키, UV0 미터 좌표에 적용할 반복 길이, 비트맵 부재 시 단색 fallback, 모델 part 배정을 소유한다. 키마다 물성·관찰은 [팔레트](00-surface-palette.md)가, 공간 표면 배정은 [공간 결속](20-space-bindings.md#space-binding-map)이 소유한다. 색은 sRGB이며 source는 선형 광량으로 변환한다. 텍스처 좌표 배율은 U·V 각각 반복 길이의 역수다. 비트맵이 없을 때는 texture=null과 표의 기본색·팔레트 물성을 쓴다. 비트맵을 쓰는 part의 UV0가 없거나 유한하지 않으면 결속을 실패시켜야 하며 단색으로 조용히 넘어가지 않는다. 모델의 UV0 투영과 이음은 [축척 기준](../contracts/principles-models.md#temple-reference-scale)이 소유한다.

| 결속 키 | 반복 길이 U·V (m) | 비트맵 부재 시 단색 fallback |
| --- | --- | --- |
| `limestone` | 1.00·1.00 | `#c9c0ad` |
| `paving` | 2.00·2.00 | `#c9c0ad` |
| `paving-small` | 1.00·1.00 | `#c9c0ad` |
| `dado` | 1.50·1.50 | `#866350` |
| `dark-metal` | 0.18·0.18 | `#574b39` |
| `dark-wood` | 1.00·1.00 | `#795339` |
| `terracotta` | 0.22·0.22 | `#9a684b` |
| `roof-terracotta` | 0.50·0.50 | `#874b38` |
| `wicker` | 0.11·0.11 | `#a58658` |
| `parchment` | 0.16·0.16 | `#c6aa77` |
| `linen` | 0.25·0.25 | `#8a7564` |
| `rope-fibre` | 0.10·0.10 | `#96805c` |
| `soil` | 0.25·0.25 | `#8c795c` |
| `distant-earth` | 1.00·1.00 | `#827e69` |
| `water` | 0.50·0.50 | `#668b91` |
| `foliage` | 0.28·0.28 | `#526448` |
| `plaster` | 1.50·1.50 | `#cdb68e` |

절차 자산은 `limestone`→`stone.png`, `paving`·`paving-small`→`paving.png`, `plaster`·`dado`→`plaster.png`, `dark-wood`→`timber.png`, `linen`→`textile.png`, `soil`→`earth.png`이다. 다른 키는 이 초안에서 비트맵 없이 기본색을 쓴다. 기존 `tile.png`는 삭제하지 않지만 그 직교 격자를 실제 개별 기와에 씌우지 않는다. 비트맵의 채널은 sRGB base color뿐이며 금속도·거칠기·법선·높이를 이미지의 회색값에서 추론하지 않는다. 한 자산을 여러 키가 공유해도 기본색·물성은 각 키의 H2에서 별개로 적용한다.

각 행의 part 목록은 해당 모델 H2가 방출하는 part 표면이다. 같은 part는 정확히 하나의 키를 쓴다. 봉헌 그릇의 도기 변형은 같은 `bowl` 표면과 UV0를 유지하고 금속 대신 도기 결속을 택한다. 기록실·보관실의 기본 궤 원형과 직물 변형도 표면 ID와 UV0 미터 단위를 유지한다. 실체가 없는 face id를 재료가 추가하거나, 기와·수반·문처럼 서로 다른 part를 하나의 표면으로 합치지 않는다.

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

모델 결속의 검토 단위는 각 원형의 모든 방출 part다. 모델 원형 H2의 `part와 표면은` 선언과 이 표를 양방향으로 대조해 빠진 part·가짜 part·중복 키를 거부한다. 기둥의 네 석재 part, 트러스의 네 목재 part, 문짝의 목재·철물 분리, `tegula`·`imbrex`·`ridge`의 실제 기와 면을 검토판에서 우선 본다. 소품도 같은 주소 전수 검사에 남기되 색·거칠기의 관찰은 근사 수준으로 둔다. 공간 face가 이 모델 표의 part 이름과 우연히 같아도 [공간 결속](20-space-bindings.md#space-binding-map)의 별도 주소로 판단한다.
