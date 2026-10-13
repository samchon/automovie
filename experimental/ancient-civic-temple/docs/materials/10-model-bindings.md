# Model parts and material bindings

## Binding keys and repeat lengths {#binding-map}

<!--
@evidence settings/40-environment.md#neighborhood Separates neighbor wall/recess as plaster, plinth limestone, and roof roof-terracotta in the part table.
@evidence principles/core/common.md#declared-basis Uses part names/metre UV0 projections of 49 reviewed model H2s and this palette-key table as binding authority.
@evidence principles/core/common.md#scope-preservation Defines one key/repeat length per emitted part, leaving geometry, normals, and UV0 with models.
@evidence principles/core/common.md#substantive-completion Key repeat lengths/base colors and part assignments together determine fallback and texture use per emitted part.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes prototype part subdivisions concrete through stone, timber, ceramic, metal, textile, and other keys with U/V repeats.
@evidence principles/design/materials.md#material-construction-appearance Models emit physical parts; this H2 specifies only key base colors, bitmaps, and repeat lengths.
@evidence principles/design/materials.md#material-binding-interface Maps model part names/metre UV0 to keys, failing textured parts without UVs.
@evidence principles/design/materials.md#material-verification-address Compares all prototype parts for omissions/duplicates, prioritizing columns, trusses, door hardware, and tiles on the board.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Compared 49 prototype part names/UV0 projections with bindings; this table creates no parts or new surface boundaries.
@evidence models/cladding.md#ridge-tile `cladding#ridge-tile`'s emitted part bindings: `ridge` → `roof-terracotta`.
@evidence models/cladding.md#roof-tile `cladding#roof-tile`'s flat plate, raised front lip, and semicircular cover bindings: `tegula`, `lip`, `imbrex` → `roof-terracotta`.
@evidence models/columns.md#colonnade-column `columns#colonnade-column`'s emitted part bindings: `plinth`, `base`, `shaft`, `capital` → `limestone`.
@evidence models/columns.md#porch-column `columns#porch-column`'s emitted part bindings: `plinth`, `base`, `shaft`, `capital` → `limestone`.
@evidence models/entablature.md#ceiling-joist `entablature#ceiling-joist`'s emitted part bindings: `timber` → `dark-wood`.
@evidence models/entablature.md#colonnade-beam `entablature#colonnade-beam`'s emitted part bindings: `timber` → `dark-wood`.
@evidence models/entablature.md#porch-entablature `entablature#porch-entablature`'s emitted part bindings: `beam`, `cornice`, `raking-trim` → `limestone`.
@evidence models/entablature.md#rafter `entablature#rafter`'s emitted part bindings: `timber` → `dark-wood`.
@evidence models/entablature.md#sanctuary-truss `entablature#sanctuary-truss`'s emitted part bindings: `tie-beam`, `principal`, `king-post`, `strut` → `dark-wood`.
@evidence models/fixtures.md#altar `fixtures#altar`'s emitted part bindings: `step`, `top`, `support` → `limestone`.
@evidence models/fixtures.md#chest `fixtures#chest`'s emitted part bindings: `body`, `lid` → `dark-wood`; `hasp`, `strap` → `dark-metal`.
@evidence models/fixtures.md#desk `fixtures#desk`'s emitted part bindings: `top`, `leg`, `stretcher` → `dark-wood`.
@evidence models/fixtures.md#display-shelf `fixtures#display-shelf`'s emitted part bindings: `side`, `board` → `dark-wood`.
@evidence models/fixtures.md#fountain `fixtures#fountain`'s emitted part bindings: `step`, `rim`, `basin-inner`, `nozzle` → `limestone`; `water`, `ripple`, `jet` → `water`.
@evidence models/fixtures.md#lampstand `fixtures#lampstand`'s emitted part bindings: `foot`, `stem`, `knop`, `dish` → `dark-metal`.
@evidence models/fixtures.md#niche `fixtures#niche`'s emitted part bindings: `plinth`, `body`, `recess-frame`, `recess`, `cap` → `limestone`.
@evidence models/fixtures.md#offering-table `fixtures#offering-table`'s emitted part bindings: `top`, `trestle` → `limestone`.
@evidence models/fixtures.md#scroll-shelf `fixtures#scroll-shelf`'s emitted part bindings: `frame`, `board`, `divider` → `dark-wood`.
@evidence models/fixtures.md#stool `fixtures#stool`'s emitted part bindings: `seat`, `leg`, `stretcher` → `dark-wood`.
@evidence models/landscape.md#broad-tree `landscape#broad-tree`'s emitted part bindings: `trunk`, `branch` → `dark-wood`; `crown` → `foliage`.
@evidence models/landscape.md#cypress `landscape#cypress`'s emitted part bindings: `trunk` → `dark-wood`; `crown` → `foliage`.
@evidence models/landscape.md#grass-tuft `landscape#grass-tuft`'s emitted part bindings: `blade` → `foliage`.
@evidence models/landscape.md#neighbor-house `landscape#neighbor-house`'s emitted part bindings: `wall`, `recess` → `plaster`; `plinth` → `limestone`; `roof` → `roof-terracotta`.
@evidence models/openings.md#door-frame `openings#door-frame`'s emitted part bindings: `lining`, `surround` → `limestone`.
@evidence models/openings.md#double-door-leaf `openings#double-door-leaf`'s emitted part bindings: `frame`, `panel` → `dark-wood`; `plate`, `pin`, `ring`, `hinge` → `dark-metal`.
@evidence models/openings.md#single-door-leaf `openings#single-door-leaf`'s emitted part bindings: `board`, `batten` → `dark-wood`; `strap`, `pin`, `ring` → `dark-metal`.
@evidence models/openings.md#window-frame `openings#window-frame`'s emitted part bindings: `lining`, `surround` → `limestone`.
@evidence models/portable.md#bench `portable#bench`'s emitted part bindings: `seat`, `pier` → `limestone`.
@evidence models/portable.md#bucket `portable#bucket`'s emitted part bindings: `body`, `handle` → `terracotta`.
@evidence models/portable.md#carrying-yoke `portable#carrying-yoke`'s emitted part bindings: `beam` → `dark-wood`; `hook` → `dark-metal`.
@evidence models/portable.md#handcart `portable#handcart`'s emitted part bindings: `deck`, `handle`, `support` → `dark-wood`; `axle`, `wheel` → `dark-wood`.
@evidence models/portable.md#jar-rack `portable#jar-rack`'s emitted part bindings: `top`, `leg`, `well` → `dark-wood`.
@evidence models/portable.md#offering-tray `portable#offering-tray`'s emitted part bindings: `floor`, `rim` → `dark-metal`.
@evidence models/portable.md#planter `portable#planter`'s emitted part bindings: `pot` → `terracotta`; `soil` → `soil`.
@evidence models/portable.md#portable-lamp `portable#portable-lamp`'s emitted part bindings: `foot`, `stem`, `dish` → `dark-metal`.
@evidence models/portable.md#rope-coil `portable#rope-coil`'s emitted part bindings: `rope`, `tie` → `rope-fibre`.
@evidence models/portable.md#stylus `portable#stylus`'s emitted part bindings: `shaft`, `tip` → `dark-metal`.
@evidence models/portable.md#textile `portable#textile`'s emitted part bindings: `cloth` → `linen`.
@evidence models/portable.md#votive-plaque `portable#votive-plaque`'s emitted part bindings: `base`, `slab` → `limestone`.
@evidence models/portable.md#writing-tablet `portable#writing-tablet`'s emitted part bindings: `frame` → `dark-wood`; `writing-face` → `parchment`.
@evidence models/ritual.md#censer `ritual#censer`'s emitted part bindings: `foot`, `stem`, `cup` → `dark-metal`; `ash`, `incense` → `soil`.
@evidence models/ritual.md#floor-cushion `ritual#floor-cushion`'s emitted part bindings: `base`, `pad`, `fold` → `linen`.
@evidence models/ritual.md#jar-stand `ritual#jar-stand`'s emitted part bindings: `foot`, `post`, `ring` → `limestone`.
@evidence models/wares.md#basket `wares#basket`'s emitted part bindings: `wall`, `rim`, `floor` → `wicker`.
@evidence models/wares.md#carry-jar `wares#carry-jar`'s emitted part bindings: `body`, `handle` → `terracotta`.
@evidence models/wares.md#offering-bowl `wares#offering-bowl`'s emitted part bindings: `bowl` → `dark-metal`.
@evidence models/wares.md#scroll `wares#scroll`'s emitted part bindings: `sheet`, `sheet-1`, `sheet-2`, `sheet-3` → `parchment`; `tie` → `rope-fibre`.
@evidence models/wares.md#small-vessel `wares#small-vessel`'s emitted part bindings: `body`, `handle` → `terracotta`.
@evidence models/wares.md#storage-jar `wares#storage-jar`'s emitted part bindings: `body`, `handle` → `terracotta`.
@evidence obligations/core/common.md#proportionate-development Maps 138 parts of 49 prototypes to 17 keys, separating 96 spatial faces into their own table so building/prop omissions receive equal scrutiny.
@evidence obligations/design/materials.md#material-identity-assembly Fixes 17 base colors, U/V repeats, and bitmap usage in the table while prototypes retain physical part geometry.
@evidence settings/00-delivery.md#coordinates Divides world-metre UV0 by per-key U/V repeat lengths, consuming Y-up faces without geometric movement.
@evidence settings/20-envelope.md#material-language Separates stone, ochre plaster, timber, tile, bronze, and red dado into keys/base colors/repeat lengths.
@evidence settings/35-objects.md#altar Assigns altar step/top/support to limestone in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#baskets Assigns basket wall/rim/floor to dry wicker in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#bench Assigns bench seat/pier to limestone in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#bucket Assigns bucket body/handle to ceramic in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#carrying-yoke Separates timber yoke beam and metal hooks in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#censer Separates metal censer foot/stem/cup from soil ash/incense in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#chests Separates timber chest body/lid from metal hasp/strap in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#floor-cushion Assigns cushion base/pad/fold to linen in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#handcart Assigns cart deck/handle/support/axle/wheel to timber in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#jar-rack Assigns rack top/leg/well to timber in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#jar-stand Assigns stand foot/post/ring to limestone in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#lampstands Assigns lampstand foot/stem/knop/dish to metal in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#offering-table Assigns table top/trestle to limestone in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#offering-tray Assigns tray floor/rim to metal in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#planter Separates ceramic pot from soil in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#portable-lamp Assigns lamp foot/stem/dish to metal in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#rope-coil Assigns rope/tie to dry fibre in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#scrolls Separates parchment sheets from fibre ties in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#shelves Assigns display/scroll-shelf timber parts in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#stylus Assigns stylus shaft/tip to metal in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#textile Assigns portable cloth to linen in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#vessels Separates ceramic storage/carry/small vessels from metal offering-bowl in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#votive-plaque Assigns plaque base/slab to limestone in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#workstation Assigns desk top/leg/stretcher and stool seat/legs to timber in this part/key table without changing geometry or use location.
@evidence settings/35-objects.md#writing-tablet Separates light writing-face from timber frame in this part/key table without changing geometry or use location.
-->

Under the 2026-09-25 procedural-texture instruction, assign every model part one material key. This table owns keys, repeat lengths applied to metre UV0, absent-bitmap base-color fallback, and part assignments. [Palette](00-surface-palette.md) owns properties/observations per key; [space bindings](20-space-bindings.md#space-binding-map) owns spatial assignment. Colors are sRGB, converted to linear light by source. Texture coordinate scales are inverse U/V repeat lengths. Without bitmaps, use texture=null and listed base colors/palette properties. Missing or nonfinite UV0 on textured parts must fail rather than silently falling back. [Scale reference](../contracts/principles-models.md#temple-reference-scale) owns model UV0 projections/seams.

| Binding key | Repeat U·V (m) | Base-color fallback without bitmap |
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

Procedural assets bind `limestone`→`stone.png`, `paving`/`paving-small`→`paving.png`, `plaster`/`dado`→`plaster.png`, `dark-wood`→`timber.png`, `roof-terracotta`→`tile.png`, `linen`→`textile.png`, and `soil`→`earth.png`. Other keys use base colors without bitmaps. `tile.png` contains clay mottling without orthogonal grids. Image channels are sRGB base color only; do not infer metalness, roughness, normals, or height from grayscale. Shared assets retain separate base colors/properties under each key's H2.

Each row lists actual part surfaces from its model H2; each part uses exactly one key. A ceramic offering-bowl variant retains the same `bowl`/UV0, selecting ceramic instead of metal. Basic records/storage chest prototypes and textile variants retain surface IDs/metre UV0. Materials creates no nonexistent face IDs and merges no distinct tile/basin/door parts into one surface.

| Model H2 | Part surface | Binding key |
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

The review population is every emitted part of each prototype. Compare actual prototype parts against this authored table for missing/fake parts or duplicate keys; there is no sentence-based checker establishing that correspondence. Prioritize four stone column parts, four timber truss parts, door timber/hardware separation, and actual `tegula`, `lip`, `imbrex`, and `ridge` faces on the board. Props remain in the full address review, with approximate color/roughness judgment. Coincident spatial face/part names still use separate [space-binding](20-space-bindings.md#space-binding-map) addresses.
