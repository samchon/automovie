# 모델 part와 재료 결속

## 결속 키와 반복 길이 {#binding-map}

<!--
@evidence settings/40-environment.md#neighborhood 이웃집 prototype의 wall·recess는 plaster, plinth는 limestone, roof는 roof-terracotta로 part 결속표에서 나눈다.
@evidence principles/core/common.md#declared-basis 49개 reviewed model H2의 part 이름과 UV0 미터 투영 및 이 문서의 팔레트 키 표를 결속의 출처로 둔다.
@evidence principles/core/common.md#scope-preservation 모델의 방출 part마다 한 키와 반복 길이를 정하고 원형 형상·법선·UV0는 모델 소유로 남긴다.
@evidence principles/core/common.md#substantive-completion 키 표의 반복 길이·기본색과 아래 part 결속표가 함께 있어 각 방출 part의 fallback과 텍스처 적용 여부를 판정할 수 있다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 모델 원형의 part 분할을 석재·목재·도기·금속·직물 등 각 키와 U/V 반복 길이로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance 물리 part는 모델이 방출하고 이 H2는 키별 기본색·비트맵·반복 길이만 지정한다.
@evidence principles/design/materials.md#material-binding-interface model H2의 part 이름·UV0 미터 좌표를 키 표에 대응시키며 UV 없는 textured part는 오류로 둔다.
@evidence principles/design/materials.md#material-verification-address 원형 전체 part를 표와 대조해 누락·중복을 찾고 기둥·트러스·문철물·기와는 모델 검토판에서 우선 본다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work models의 49 prototype part 이름과 UV0 투영을 결속표와 대조했고 이 표는 part를 새로 만들거나 표면 경계를 바꾸지 않는다.
@evidence models/cladding.md#ridge-tile `cladding#ridge-tile`의 방출 part 결속: `ridge` → `roof-terracotta`.
@evidence models/cladding.md#roof-tile `cladding#roof-tile`의 기본 판·들린 앞끝·반원 덮개 결속: `tegula`, `lip`, `imbrex` → `roof-terracotta`.
@evidence models/columns.md#colonnade-column `columns#colonnade-column`의 방출 part 결속: `plinth`, `base`, `shaft`, `capital` → `limestone`.
@evidence models/columns.md#porch-column `columns#porch-column`의 방출 part 결속: `plinth`, `base`, `shaft`, `capital` → `limestone`.
@evidence models/entablature.md#ceiling-joist `entablature#ceiling-joist`의 방출 part 결속: `timber` → `dark-wood`.
@evidence models/entablature.md#colonnade-beam `entablature#colonnade-beam`의 방출 part 결속: `timber` → `dark-wood`.
@evidence models/entablature.md#porch-entablature `entablature#porch-entablature`의 방출 part 결속: `beam`, `cornice`, `raking-trim` → `limestone`.
@evidence models/entablature.md#rafter `entablature#rafter`의 방출 part 결속: `timber` → `dark-wood`.
@evidence models/entablature.md#sanctuary-truss `entablature#sanctuary-truss`의 방출 part 결속: `tie-beam`, `principal`, `king-post`, `strut` → `dark-wood`.
@evidence models/fixtures.md#altar `fixtures#altar`의 방출 part 결속: `step`, `top`, `support` → `limestone`.
@evidence models/fixtures.md#chest `fixtures#chest`의 방출 part 결속: `body`, `lid` → `dark-wood`; `hasp`, `strap` → `dark-metal`.
@evidence models/fixtures.md#desk `fixtures#desk`의 방출 part 결속: `top`, `leg`, `stretcher` → `dark-wood`.
@evidence models/fixtures.md#display-shelf `fixtures#display-shelf`의 방출 part 결속: `side`, `board` → `dark-wood`.
@evidence models/fixtures.md#fountain `fixtures#fountain`의 방출 part 결속: `step`, `rim`, `basin-inner`, `nozzle` → `limestone`; `water`, `ripple`, `jet` → `water`.
@evidence models/fixtures.md#lampstand `fixtures#lampstand`의 방출 part 결속: `foot`, `stem`, `knop`, `dish` → `dark-metal`.
@evidence models/fixtures.md#niche `fixtures#niche`의 방출 part 결속: `plinth`, `body`, `recess-frame`, `recess`, `cap` → `limestone`.
@evidence models/fixtures.md#offering-table `fixtures#offering-table`의 방출 part 결속: `top`, `trestle` → `limestone`.
@evidence models/fixtures.md#scroll-shelf `fixtures#scroll-shelf`의 방출 part 결속: `frame`, `board`, `divider` → `dark-wood`.
@evidence models/fixtures.md#stool `fixtures#stool`의 방출 part 결속: `seat`, `leg`, `stretcher` → `dark-wood`.
@evidence models/landscape.md#broad-tree `landscape#broad-tree`의 방출 part 결속: `trunk`, `branch` → `dark-wood`; `crown` → `foliage`.
@evidence models/landscape.md#cypress `landscape#cypress`의 방출 part 결속: `trunk` → `dark-wood`; `crown` → `foliage`.
@evidence models/landscape.md#grass-tuft `landscape#grass-tuft`의 방출 part 결속: `blade` → `foliage`.
@evidence models/landscape.md#neighbor-house `landscape#neighbor-house`의 방출 part 결속: `wall`, `recess` → `plaster`; `plinth` → `limestone`; `roof` → `roof-terracotta`.
@evidence models/openings.md#door-frame `openings#door-frame`의 방출 part 결속: `lining`, `surround` → `limestone`.
@evidence models/openings.md#double-door-leaf `openings#double-door-leaf`의 방출 part 결속: `frame`, `panel` → `dark-wood`; `plate`, `pin`, `ring`, `hinge` → `dark-metal`.
@evidence models/openings.md#single-door-leaf `openings#single-door-leaf`의 방출 part 결속: `board`, `batten` → `dark-wood`; `strap`, `pin`, `ring` → `dark-metal`.
@evidence models/openings.md#window-frame `openings#window-frame`의 방출 part 결속: `lining`, `surround` → `limestone`.
@evidence models/portable.md#bench `portable#bench`의 방출 part 결속: `seat`, `pier` → `limestone`.
@evidence models/portable.md#bucket `portable#bucket`의 방출 part 결속: `body`, `handle` → `terracotta`.
@evidence models/portable.md#carrying-yoke `portable#carrying-yoke`의 방출 part 결속: `beam` → `dark-wood`; `hook` → `dark-metal`.
@evidence models/portable.md#handcart `portable#handcart`의 방출 part 결속: `deck`, `handle`, `support` → `dark-wood`; `axle`, `wheel` → `dark-wood`.
@evidence models/portable.md#jar-rack `portable#jar-rack`의 방출 part 결속: `top`, `leg`, `well` → `dark-wood`.
@evidence models/portable.md#offering-tray `portable#offering-tray`의 방출 part 결속: `floor`, `rim` → `dark-metal`.
@evidence models/portable.md#planter `portable#planter`의 방출 part 결속: `pot` → `terracotta`; `soil` → `soil`.
@evidence models/portable.md#portable-lamp `portable#portable-lamp`의 방출 part 결속: `foot`, `stem`, `dish` → `dark-metal`.
@evidence models/portable.md#rope-coil `portable#rope-coil`의 방출 part 결속: `rope`, `tie` → `rope-fibre`.
@evidence models/portable.md#stylus `portable#stylus`의 방출 part 결속: `shaft`, `tip` → `dark-metal`.
@evidence models/portable.md#textile `portable#textile`의 방출 part 결속: `cloth` → `linen`.
@evidence models/portable.md#votive-plaque `portable#votive-plaque`의 방출 part 결속: `base`, `slab` → `limestone`.
@evidence models/portable.md#writing-tablet `portable#writing-tablet`의 방출 part 결속: `frame` → `dark-wood`; `writing-face` → `parchment`.
@evidence models/ritual.md#censer `ritual#censer`의 방출 part 결속: `foot`, `stem`, `cup` → `dark-metal`; `ash`, `incense` → `soil`.
@evidence models/ritual.md#floor-cushion `ritual#floor-cushion`의 방출 part 결속: `base`, `pad`, `fold` → `linen`.
@evidence models/ritual.md#jar-stand `ritual#jar-stand`의 방출 part 결속: `foot`, `post`, `ring` → `limestone`.
@evidence models/wares.md#basket `wares#basket`의 방출 part 결속: `wall`, `rim`, `floor` → `wicker`.
@evidence models/wares.md#carry-jar `wares#carry-jar`의 방출 part 결속: `body`, `handle` → `terracotta`.
@evidence models/wares.md#offering-bowl `wares#offering-bowl`의 방출 part 결속: `bowl` → `dark-metal`.
@evidence models/wares.md#scroll `wares#scroll`의 방출 part 결속: `sheet`, `sheet-1`, `sheet-2`, `sheet-3` → `parchment`; `tie` → `rope-fibre`.
@evidence models/wares.md#small-vessel `wares#small-vessel`의 방출 part 결속: `body`, `handle` → `terracotta`.
@evidence models/wares.md#storage-jar `wares#storage-jar`의 방출 part 결속: `body`, `handle` → `terracotta`.
@evidence obligations/core/common.md#proportionate-development 49개 원형의 138개 part를 키 17개와 대응시키고, 96개 공간 면은 별도 결속표로 분리해 건물 면과 소품을 같은 누락 검사를 받게 한다.
@evidence obligations/design/materials.md#material-identity-assembly 키 17개의 기본색·U/V 반복 길이·비트맵 결속 여부를 표로 고정하고 물리 part의 형상은 원형에 남긴다.
@evidence settings/00-delivery.md#coordinates 월드 m 좌표의 UV0를 키별 U/V 반복 길이로 나누고 Y-up의 공간 face를 기하 이동 없이 받는다.
@evidence settings/20-envelope.md#material-language 석재·황토 회벽·목재·기와·청동·붉은 띠를 각각 키와 기본색·반복 길이로 분리한다.
@evidence settings/35-objects.md#altar altar step·top·support의 석재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#baskets basket wall·rim·floor의 마른 섬유색를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#bench bench seat·pier의 석재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#bucket bucket body·handle의 점토색를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#carrying-yoke yoke beam의 목재와 hook의 금속 분리를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#censer censer foot·stem·cup의 금속과 ash·incense 흙색 분리를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#chests chest body·lid 목재와 hasp·strap 금속 분리를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#floor-cushion floor-cushion base·pad·fold 직물를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#handcart handcart deck·handle·support·axle·wheel의 목재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#jar-rack jar-rack top·leg·well의 목재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#jar-stand jar-stand foot·post·ring의 석재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#lampstands lampstand foot·stem·knop·dish의 금속를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#offering-table offering-table top·trestle의 석재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#offering-tray offering-tray floor·rim의 금속를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#planter planter pot 점토색과 soil 흙색 분리를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#portable-lamp portable-lamp foot·stem·dish의 금속를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#rope-coil rope-coil rope·tie의 섬유색를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#scrolls scroll sheet의 필기면과 tie 끈 분리를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#shelves display-shelf 및 scroll-shelf의 목재 part를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#stylus stylus shaft·tip의 금속를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#textile portable cloth의 직물를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#vessels storage/carry/small vessel의 도기와 offering-bowl의 금속 분리를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#votive-plaque votive-plaque base·slab의 석재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#workstation desk top·leg·stretcher와 stool seat·leg의 목재를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
@evidence settings/35-objects.md#writing-tablet writing-tablet writing-face의 밝은 필기면과 frame 목재 분리를 이 H2 part-키 결속표에 배정하고 물체의 형상과 사용 장소는 바꾸지 않는다.
-->

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

절차 자산은 `limestone`→`stone.png`, `paving`·`paving-small`→`paving.png`, `plaster`·`dado`→`plaster.png`, `dark-wood`→`timber.png`, `roof-terracotta`→`tile.png`, `linen`→`textile.png`, `soil`→`earth.png`이다. 다른 키는 비트맵 없이 기본색을 쓴다. `tile.png`는 직교 격자 없이 점토 얼룩만 담는다. 비트맵의 채널은 sRGB base color뿐이며 금속도·거칠기·법선·높이를 이미지의 회색값에서 추론하지 않는다. 한 자산을 여러 키가 공유해도 기본색·물성은 각 키의 H2에서 별개로 적용한다.

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
| `cladding#roof-tile` | `tegula`, `lip`, `imbrex` | `roof-terracotta` |
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

모델 결속의 검토 단위는 각 원형의 모든 방출 part다. 모델 원형 H2의 `part와 표면은` 선언과 이 표를 양방향으로 대조해 빠진 part·가짜 part·중복 키를 거부한다. 기둥의 네 석재 part, 트러스의 네 목재 part, 문짝의 목재·철물 분리, `tegula`·`lip`·`imbrex`·`ridge`의 실제 기와 면을 검토판에서 우선 본다. 소품도 같은 주소 전수 검사에 남기되 색·거칠기의 관찰은 근사 수준으로 둔다. 공간 face가 이 모델 표의 part 이름과 우연히 같아도 [공간 결속](20-space-bindings.md#space-binding-map)의 별도 주소로 판단한다.
