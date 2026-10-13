# Temple surface materials

This file defines physical material distinctions and render response adopted from [envelope](../settings/20-envelope.md#material-language), [interiors](../settings/30-interiors.md), [site](../settings/40-environment.md), [fidelity](../settings/50-production.md#fidelity), and five references. Photographs support color, value, and member relations, not pigment analysis or surveyed measurements. [Keys/model parts](10-model-bindings.md#binding-map) and [space surfaces](20-space-bindings.md#space-binding-map) own assignments/repeat lengths. Colors are sRGB base colors converted to linear light by source. Roughness/metalness are deterministic 3D review choices, not material tests. Material assignments change no host thickness, geometry, or UV0. Procedural PNGs are 3D surface inputs, not paint over completed frames.

## Light limestone members {#stone}

<!--
@evidence principles/core/common.md#declared-basis Low yard walls inherit settings/30-interiors.md#service-yard; extending limestone to high yard faces follows north-envelope and the single service-yard.wall ID.
@evidence principles/core/common.md#scope-preservation Assigns limestone to stone model parts, curbs, and yard inner wall/wall-top, retaining plaster on outer faces.
@evidence principles/core/common.md#substantive-completion Defines #c9c0ad, roughness 0.86, stone.png repeat 1m, absent-bitmap base color, and image 01/02/03 observations.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Includes both high faces and coping under the single yard wall address in limestone, with 1m repeat/0.86 roughness and 01/02/03 views.
@evidence principles/design/materials.md#material-construction-appearance 1m stone shading and roughness 0.86 are surface response, not block geometry.
@evidence principles/design/materials.md#material-binding-interface Separates plinth/coping/frame/column parts, yard wall/wall-top, and world-metre UV0.
@evidence principles/design/materials.md#material-verification-address Images 01 coping, 02 yard walls, and 03 fountain test light stone against timber.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The single yard wall includes low north/east and high sanctuary/storage faces; choosing stone throughout it and wall-top requires no spatial subdivision.
@evidence obligations/design/materials.md#addressable-material-decisions An independent limestone H2 allows coping/plinth/column keys and observations to change separately from plaster/paving/clay.
@evidence settings/20-envelope.md#colonnade Assigns light round-column plinth/base/shaft/capital to limestone.
@evidence settings/20-envelope.md#entrance-porch Keeps two porch columns/stone frames/lintels distinct from dark timber leaves.
@evidence settings/30-interiors.md#service-yard Low north/east walls use limestone; high yard faces share it as a material choice over spaces' single wall ID.
@evidence spaces/facades/north.md#north-envelope Distinguishes north exterior plaster from yard-facing stone/coping while assigning limestone to the single inner wall ID.
@evidence spaces/junctions.md#plinth-coping Binds physical plinth/coping/door surrounds to limestone, switching plaster only at existing members.
@evidence spaces/openings.md#doors Separates stone frame lining/surround from timber leaves/metal hardware.
@evidence spaces/rooms/service-yard.md#yard-volume Assigns yard inner wall/wall-top limestone and floor paving.

-->

Assign `limestone` to stone plinth, coping, frames, columns, altar, benches, fountain, and other model-table solids and space-table curbs. `surface.service-yard.wall` includes low north/east inner walls and yard-facing sanctuary, north-colonnade east end, and storage north walls: all read as stone. `surface.service-yard.wall-top` coping is stone; north/east `outer` faces retain plaster. Base color `#c9c0ad`, roughness 0.86, metalness 0, opacity 1. Repeat shallow `stone.png` shading 1m×1m, retaining base color without bitmap. Spaces/models own actual thickness; joints painted in texture do not create fake blocks. Under one daylight, compare image 01 porch columns/coping, 02 yard enclosure, and 03 basin rim for colder stone distinct from timber/plaster.

## Cut-stone floors and paving {#paving}

<!--
@evidence principles/core/common.md#declared-basis Stone-floors small-room slabs authorize paving-small on administration/records/storage floors; courtyard/colonnade large slabs use paving.
@evidence principles/core/common.md#scope-preservation Distinguishes paving in courtyard/colonnade/entrance/sanctuary/offering/yard/site paths from three paving-small floors without new boundaries/steps.
@evidence principles/core/common.md#substantive-completion Defines two keys' colors/roughness and shared paving.png repeats 2m/1m, failing identical workplace/colonnade joint spacing at thresholds.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Derives large/small slab appearance through 2m/1m repeats of one bitmap and compares threshold joint periods.
@evidence principles/design/materials.md#material-construction-appearance Uses one stone image at paving 2m/paving-small 1m for different joint spacing.
@evidence principles/design/materials.md#material-binding-interface Consumes existing planar UV0 on floor IDs/site.paving and inherited floor heights.
@evidence principles/design/materials.md#material-verification-address Compares four-cell periods in 2m colonnade and 1m workplace threshold samples.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Three workplaces already have distinct floor IDs; 1m paving-small is a material choice without height/boundary/UV0 changes.
@evidence settings/10-building.md#ground-access Joins ground-storey floors/thresholds with stone without changing stairs/slopes/heights.
@evidence settings/10-building.md#use-profile Consumes existing passage faces without geometry intruding into envelope width.
@evidence settings/20-envelope.md#stone-floors Courtyard/colonnade/entrance/sanctuary use paving 2m; administration/records/storage use paving-small 1m.
@evidence settings/30-interiors.md#records Records floor shares administration paving-small, distinct from colonnade 2m joints.
@evidence spaces/rooms/courtyard.md#court-volume Courtyard floor uses paving 2m; fountain water/stone retain separate model parts.
@evidence spaces/rooms/records.md#records-volume Records floor uses paving-small 1m with wall/ceiling separate.
@evidence spaces/rooms/storage.md#storage-volume Storage floor uses paving-small 1m; walls/ceilings remain plaster/dark-wood.
@evidence spaces/site.md#site-paving Site paving uses paving, curbs limestone, and earth strips soil.
@evidence spaces/storey.md#threshold-support Compares three workplace thresholds' 1m paving against colonnade 2m.
@evidence spaces/ownership.md#surface-map Assigns the three workplace floors paving-small and colonnade paving to separate joint periods.

-->

Assign `paving` to courtyard, colonnade, entrance, sanctuary, offering, yard floors, and site paving. Administration, records, and storage floors use `paving-small`. Both use `#c9c0ad`, roughness 0.90, metalness 0, opacity 1. One `paving.png` period has four cells per axis: 2m×2m paving yields 0.5m joints; 1m×1m paving-small yields 0.25m. Image 01/03/05 paths/yards remain legible without texture changing floors, stairs, or curbs. Missing bitmap leaves stone color. Compare four cells in a 2m colonnade sample against four in each 1m workplace sample at all three thresholds. Equal workplace/colonnade spacing or floor joints on walls fails.

## Ochre plaster {#plaster}

<!--
@evidence principles/core/common.md#declared-basis Ochre walls authorize plaster on exterior/general room walls, excluding north-envelope stone yard boundaries.
@evidence principles/core/common.md#scope-preservation Assigns exterior/interior walls, gables, parapets, returns, and concealed joint/bearing plaster; yard inner wall/wall-top remain limestone.
@evidence principles/core/common.md#substantive-completion Defines ochre color, 0.96 roughness, plaster.png 1.5m repeat, concealed fallback, and 01/03/04 checks that mottles do not hide voids.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Derives ochre exterior/room/gable plaster with 1.5m mottling and visual separation from coping/timber doors.
@evidence principles/design/materials.md#material-construction-appearance 1.5m pattern/0.96 roughness creates neither thickness nor opening voids.
@evidence principles/design/materials.md#material-binding-interface Consumes outer/wall/bearing/joint, excluding stone yard wall/wall-top.
@evidence principles/design/materials.md#material-verification-address Images 01 exterior, 03 courtyard, and 04 sanctuary test distinction of red threshold bands/stone coping.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Yard inner wall/wall-top have separate IDs, so exclude them from outer plaster; mottles bind existing UV0 without geometry repair.
@evidence settings/20-envelope.md#walls Assigns ochre plaster to outer/general walls, separating stone plinth/coping/yard faces.
@evidence spaces/openings.md#clerestories Consumes plaster and limestone reveals on distinct faces without covering clerestory voids.

-->

Assign `plaster` to exterior `outer`, general interior `wall`, exposed gables/parapets, and returns, excluding stone yard inner walls/coping. Base `#cdb68e`, roughness 0.96, metalness 0, opacity 1; weak `plaster.png` mottles repeat 1.5m×1.5m. Concealed wall `joint`/roof `bearing` use the same base color without floating new surfaces. Ground wear remains subtle without corrosion geometry or arbitrary rectangular patches. Missing bitmap leaves a cream plane. At equal exposure in 01 exterior/03 courtyard/04 sanctuary, separate coping/timber doors; mottles hiding wall solids or window voids fail.

## Red lower bands in colonnade and sanctuary {#dado}

<!--
@evidence principles/core/common.md#declared-basis Only the two colonnade/sanctuary Y=0~0.60m faces separated by interior-dado receive dado.
@evidence principles/core/common.md#scope-preservation Limits dado to both IDs/Y 0~0.60m, retaining geometry/placement/neighbor-material ownership.
@evidence principles/core/common.md#substantive-completion Defines #866350, roughness 0.94, and plaster.png repeat 1.5m on the two Y=0~0.60m dado faces; a duplicated wall binding or red band extending into other rooms fails at 03/04 thresholds.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Derives dado binding/response from the 0.60m line; 03 colonnade/04 sanctuary thresholds test interruptions without leakage into other rooms.
@evidence principles/design/materials.md#material-construction-appearance Red base color using plaster.png is paint, not ledge geometry.
@evidence principles/design/materials.md#material-binding-interface Follows two dado IDs, existing Y=0.60m split, and door voids.
@evidence principles/design/materials.md#material-verification-address 03/04 thresholds test interrupted bands without spreading into other rooms.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing separate dado IDs/0.60m boundaries need no duplicate wall faces or new cuts for red material.
@evidence settings/30-interiors.md#sanctuary Sanctuary lower Y=0~0.60m dado remains distinct from upper plaster.
@evidence spaces/ownership.md#interior-dado Only both rooms' lower Y=0~0.60m faces receive red dado, stopping at voids.

-->

Assign `dado` only to `surface.colonnade.dado`/`surface.sanctuary.dado`, consuming existing Y=0~0.60m subdivision without new height/void/thickness decisions. Base `#866350`, roughness 0.94, metalness 0, opacity 1; low-amplitude `plaster.png` repeats 1.5m×1.5m. Image 03/04 thresholds/corners test aligned tops without spread to offering, records, or exterior. Duplicate color-only binding above original wall faces fails.

## Structural and furniture timber {#timber}

<!--
@evidence principles/core/common.md#declared-basis Exposed ceilings and sanctuary-truss members authorize building dark-wood; furniture/tree timber parts also select it.
@evidence models/entablature.md#sanctuary-truss Truss tie-beam/principal/king-post/strut use dark-wood distinct from roof upper tile color.
@evidence principles/core/common.md#scope-preservation Assigns dark-wood to truss/rafter/leaf/furniture/tree/cart timber and ceiling/roof undersides without taking geometry/placement/adjacent materials.
@evidence principles/core/common.md#substantive-completion Defines timber color/roughness/1m repeat, long-axis board grain, cylindrical prop cross-grain proxy, and failures.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Uses dark-wood/timber.png 1m for ceilings/trusses/leaves/furniture, explicitly treating tree/cart circumferential U as a prop proxy.
@evidence principles/design/materials.md#material-construction-appearance 1m grain/0.78 roughness are response; hosts own beam lengths/leaf thickness.
@evidence principles/design/materials.md#material-binding-interface Consumes long-axis beam/board U, circumference U on trunks/branches/cart cylinders, and existing ceiling/roof-edge/soffit UV0.
@evidence principles/design/materials.md#material-verification-address 04 truss/05 shelf-ceiling close views test separation from plaster/stone.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Compared truss long-axis U and world ceiling/eave UV0. Tree/cart cylindrical cross-grain is an explicit proxy without parent part/face changes.
@evidence settings/20-envelope.md#ceilings Binds exposed sanctuary truss/workplace ceilings to dark-wood while models/spaces retain beam geometry.
@evidence models/landscape.md#cypress Binds cypress trunk circumference U separately from crown, acknowledging cross-grain proxy.
@evidence models/landscape.md#broad-tree Separates broad-tree trunk/branch timber from foliage, acknowledging circumference-U proxy.
@evidence models/portable.md#handcart Cart axle/wheel circumference U differs from deck long-axis grain.

-->

Assign `dark-wood` to sanctuary trusses, rafters, beams, leaves, shelves/desks, plank ceilings, and eave undersides. Base `#795339`, roughness 0.78, metalness 0, opacity 1; `timber.png` repeats 1m×1m. Beam/board grain aligns to model long-axis U; trunks/branches/cart axles/wheels show circumference-U cross-grain as prop proxies. Spatial ceilings/undersides retain world UV0; needed building grain rotations require a prior space-design correction, not invented source coordinates. Missing bitmap leaves medium brown. Compare 04 trusses/05 shelves against plaster; timber on stone benches/altar/offering table fails.

## Exposed tiles and roof tops {#roof-tile}

<!--
@evidence principles/core/common.md#declared-basis Red-brown roof-form and roof-tile/ridge-tile parts authorize roof-terracotta building faces.
@evidence principles/core/common.md#scope-preservation Limits roof-terracotta to tegula/imbrex/ridge and five roof upper faces without taking geometry/placement/adjacent finishes.
@evidence principles/core/common.md#substantive-completion Defines clay color/roughness/weak tile.png mottles, failing grids competing with actual joints.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Binds actual tile faces to clay response; 01/03 eaves test matching tile/substrate color without orthogonal grids.
@evidence principles/design/materials.md#material-construction-appearance Tile.png changes clay shading every 0.50m; models retain grooves, overlaps, and eave ends.
@evidence principles/design/materials.md#material-binding-interface Binds tile parts/roof-*.upper UV0 at 0.50m, leaving edge/soffit timber.
@evidence principles/design/materials.md#material-verification-address 01/03 eaves test matching tile/substrate clay without orthogonal grids.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Roof upper and tegula/imbrex/ridge are already separate faces/parts; shared clay binding does not redesign grooves/eaves.
@evidence settings/20-envelope.md#roof-form Assigns clay to roof uppers/tiles, timber to edges/soffits.
@evidence spaces/roofs/colonnade.md#north-canopy North canopy upper is clay; edge/soffit timber.
@evidence spaces/roofs/colonnade.md#south-canopy South canopy upper is clay; edge/soffit timber.
@evidence spaces/roofs/east.md#east-roof East upper uses roof-terracotta; underside dark-wood.
@evidence spaces/roofs/porch.md#porch-roof Porch upper clay remains separate from timber edge/soffit.
@evidence spaces/roofs/sanctuary.md#sanctuary-roof Sanctuary upper clay remains separate from timber edge/soffit.
@evidence spaces/roofs/west.md#west-roof West upper clay remains separate from timber edge/soffit.

-->

Assign `roof-terracotta` to `tegula`, `imbrex`, `ridge`, and roof `upper`. Base `#874b38`, roughness 0.84, metalness 0, opacity 1. `tile.png` contains weak clay shading without orthogonal joints, repeating 0.50m each axis. Tops are reddish substrate before placement, but actual rows, overlaps, and open eave semicircles belong to independent tiles. Missing bitmap retains base color. Image 01 overview/03 eaves test clay distinct from cream walls without painted grids competing with actual joints.

## Bronze hardware and lamps {#metal}

<!--
@evidence principles/core/common.md#declared-basis Timber-opening settings and separate double-leaf hardware authorize dark-metal only on metal parts.
@evidence models/openings.md#double-door-leaf Only plate/pin/ring/hinge receive metal; frame/panel retain dark-wood.
@evidence principles/core/common.md#scope-preservation Limits dark-metal to hardware, chest hasp/strap, lamps, censer, tray, and writing-tool metal; timber faces remain unchanged.
@evidence principles/core/common.md#substantive-completion Defines #574b39, roughness 0.39, metalness 0.82, no bitmap; excessive mirror reflection fails in 03/04/05.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Assigns no-bitmap dark-metal/0.82 metalness to leaf/chest/lamp hardware and tests timber separation in 03/04/05.
@evidence principles/design/materials.md#material-construction-appearance Metalness 0.82/roughness 0.39 do not turn timber faces into bronze.
@evidence principles/design/materials.md#material-binding-interface Consumes only separated plate/pin/ring/hinge and other metal parts without bitmaps.
@evidence principles/design/materials.md#material-verification-address 03 doors and 04/05 close views test hardware against dark timber.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Leaf hardware is already separate; response requires no mesh or hinge-axis changes.
@evidence obligations/design/materials.md#material-response Distinguishes dark-metal 0.82/0.39 response from timber/stone; other H2s retain their own colors/roughness/opacity.
@evidence settings/20-envelope.md#openings Plate/pin/ring/hinge use dark-metal while timber panels remain dark-wood.

-->

Assign `dark-metal` to door hardware, chest hasp/strap, lamps, censer, tray, and writing-tool metal parts. Base `#574b39`, roughness 0.39, metalness 0.82, opacity 1; no separate bitmap. Thin rings/pins read through reflection without making whole timber faces bronze. Images 03 open doors/04/05 close views test distinct metal without mirror glare.

## Red ceramic {#ceramic}

<!--
@evidence principles/core/common.md#declared-basis Vessel settings/storage/carry body parts authorize ceramic; selectable metal/ceramic offering-bowl variants remain separate bindings.
@evidence settings/35-objects.md#vessels Storage/carry red ceramic uses terracotta, distinct from the currently metal offering bowl.
@evidence models/wares.md#storage-jar Assigns storage body terracotta while models own silhouette/foot.
@evidence models/wares.md#carry-jar Assigns carry body/handle terracotta without replacing handle contact by finish.
@evidence principles/core/common.md#scope-preservation Limits terracotta to jar/bucket/small-vessel/pot bodies without taking geometry/placement/neighbor finishes.
@evidence principles/core/common.md#substantive-completion Defines untextured #9a684b, roughness 0.72, and repeat length 0.22m for ceramic bodies/handles/pots; 02/05 observations distinguish them from shelf timber and retain separate planter-soil and metal-bowl keys.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Binds bodies to no-bitmap terracotta and compares with storage timber in 02/05.
@evidence principles/design/materials.md#material-construction-appearance Untextured clay with declared repeat 0.22m does not substitute for actual thickness/feet.
@evidence principles/design/materials.md#material-binding-interface Applies only to body/handle/pot; planter soil and offering bowl use other keys.
@evidence principles/design/materials.md#material-verification-address 02/05 storage views test ceramic/timber distinction.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Body/handle/pot and soil already differ by parts; red finish needs no new outlines/feet.

-->

Assign `terracotta` to jar, bucket, small-vessel, and planter bodies/handles. Base `#9a684b`, roughness 0.72, metalness 0, opacity 1, declared repeat 0.22m. No bitmap; models own outlines/holes. Planter `soil` and offering `bowl` retain other keys. Image 02/05 storage views require approximate ceramic character distinct from shelf timber.

## Dry basket fibre {#wicker}

<!--
@evidence principles/core/common.md#declared-basis Basket settings and model wall/rim/floor parts authorize fibre binding.
@evidence settings/35-objects.md#baskets Uses wicker for dry carrying baskets without promising woven holes beyond the proxy.
@evidence models/wares.md#basket Assigns all three wall/rim/floor parts wicker.
@evidence principles/core/common.md#scope-preservation Limits wicker to three basket parts without geometry/placement/neighbor-finish changes.
@evidence principles/core/common.md#substantive-completion Defines untextured #a58658, roughness 0.96, and repeat length 0.11m for basket wall/rim/floor; 02 storage views distinguish dry fibre from timber/ceramic without claiming missing vertical strands through texture.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Assigns no-bitmap wicker/0.96 roughness and compares with shelf timber in 02 storage.
@evidence principles/design/materials.md#material-construction-appearance Wicker color/0.96 roughness does not promise woven holes in proxy outlines.
@evidence principles/design/materials.md#material-binding-interface Consumes existing three-part UV0 without crossing-weave bitmap.
@evidence principles/design/materials.md#material-verification-address 02 storage tests dry fibre distinct from timber shelves.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing wall/rim/floor proxies need no repair; color promises no new weave-hole geometry.

-->

Assign `wicker` to basket `wall`/`rim`/`floor`: base `#a58658`, roughness 0.96, metalness 0, opacity 1, repeat length 0.11m. No cross-weave bitmap. Actual wall bands and omitted vertical strands are model-proxy limits; texture does not implement missing strands. Image 02 storage/service yard needs dry fibre color distinct from ceramic/timber.

## Scrolls and writing surfaces {#parchment}

<!--
@evidence principles/core/common.md#declared-basis Consumes scroll settings/sheet parts, choosing the same bright key for tablet writing-face.
@evidence settings/35-objects.md#scrolls Separates light parchment sheets from rope-fibre bindings.
@evidence models/wares.md#scroll Defines only sheet finish, retaining rolled ends/ties in models.
@evidence principles/core/common.md#scope-preservation Limits parchment to sheet variants/writing-face without geometry/placement/neighbor finish changes.
@evidence principles/core/common.md#substantive-completion Defines #c6aa77, roughness 0.92, repeat length 0.16m, and no lettering bitmap for scroll sheets and writing faces; invented text or failure to distinguish these light faces from timber is rejected in 05.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Binds sheet/writing-face parchment with 0.16m repeat and blank bright background, distinct from timber frame in 05.
@evidence principles/design/materials.md#material-construction-appearance 0.16m repeat/light base color generates no actual text.
@evidence principles/design/materials.md#material-binding-interface Consumes sheet/sheet-1/2/3/writing-face only; models own curls/bundles.
@evidence principles/design/materials.md#material-verification-address 05 desk tests frame separation and absence of fake text.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Curls/ties/tablet frames already have separate parts; bright-sheet binding requires no text or new curl geometry.
-->

Assign `parchment` to scroll `sheet` variants and tablet `writing-face`: base `#c6aa77`, roughness 0.92, metalness 0, opacity 1, repeat 0.16m, no writing bitmap. Models/instances own curls, overlap, and bundling; materials provides bright record-surface shading only. Image 05 shelves/desks test distinction from dark timber; invented written content fails.

## Folded textiles and cushions {#textile}

<!--
@evidence principles/core/common.md#declared-basis Consumes folded-cloth settings and cushion base/pad/fold as linen inputs.
@evidence settings/35-objects.md#textile Cloth uses linen distinct from furniture timber.
@evidence settings/35-objects.md#floor-cushion Cushion covers use linen distinct from stone floors.
@evidence models/ritual.md#floor-cushion Defines base/pad/fold color/textile.png repeat 0.25m, leaving cushion height in models.
@evidence principles/core/common.md#scope-preservation Limits linen to cloth/cushion parts without geometry/placement/neighbor-finish changes.
@evidence principles/core/common.md#substantive-completion Defines #8a7564, roughness 0.98, and textile.png repeat 0.25m for cloth and cushion base/pad/fold, with the same-color fallback; 04/05 reject weave reading as a large grid or merging into stone/timber.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Binds linen/textile.png 0.25m and compares against furniture/plaster in 04/05.
@evidence principles/design/materials.md#material-construction-appearance 0.25m weave does not replace existing fold volume.
@evidence principles/design/materials.md#material-binding-interface Consumes only textile UV0 without changing adjacent timber/stone seats.
@evidence principles/design/materials.md#material-verification-address 04/05 tests folded cloth/cushions not absorbed into wall/furniture faces.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing cloth/base/pad/fold meshes supply UV0; weave requires no fold redesign.
-->

Assign `linen` to `cloth` and cushion `base`/`pad`/`fold`: base `#8a7564`, roughness 0.98, metalness 0, opacity 1. `textile.png` horizontal/vertical weave repeats 0.25m×0.25m; models own folds. Missing bitmap retains the color. Images 04/05 test distinction from stone/timber; a large grid-panel appearance fails.

## Binding cords and rope {#rope-fibre}

<!--
@evidence principles/core/common.md#declared-basis Consumes rope-coil settings and rope/tie parts as fibre inputs.
@evidence settings/35-objects.md#rope-coil Loose rope/tie share rope-fibre.
@evidence models/portable.md#rope-coil Assigns no-bitmap fibre color to coils/ties, leaving centerlines in models.
@evidence principles/core/common.md#scope-preservation Limits rope-fibre to scroll tie and coil rope/tie without geometry/placement/neighbor finish changes.
@evidence principles/core/common.md#substantive-completion Defines untextured #96805c, roughness 0.96, and repeat length 0.10m for scroll ties and rope-coil rope/tie; 05 comparisons retain dry fibre distinct from light record sheets without requiring individual strands.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Uses no-bitmap rope-fibre/0.96 roughness, testing dry fibre against writing surfaces/timber in 05.
@evidence principles/design/materials.md#material-construction-appearance 0.10m repeat length/0.96 roughness adds no microscopic fibre geometry.
@evidence principles/design/materials.md#material-binding-interface Consumes existing tie/rope UV0; models retain loops/coiling.
@evidence principles/design/materials.md#material-verification-address 05 record views test rope distinct from parchment/timber.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Portable prototypes already own paths/thickness; color/roughness requires no new fibre meshes.
-->

Assign `rope-fibre` to scroll `tie` and rope `rope`/`tie`: base `#96805c`, roughness 0.96, metalness 0, opacity 1, repeat 0.10m. No bitmap; models own empty loops/binding positions. Image 05 tests dry fibre against light yellow-brown records without requiring individual small-prop strands.

## Foreground earth and planter soil {#earth}

<!--
@evidence principles/core/common.md#declared-basis Consumes site settings/grade foreground earth, selecting soil also for planter soil/censer ash/incense.
@evidence principles/core/common.md#scope-preservation Assigns soil to foreground earth/ground, distant foothill ground, planter soil, ash/incense; ridge remains distant-earth.
@evidence principles/core/common.md#substantive-completion Defines earth.png 0.25m foreground repeat, solid small parts, #8c795c/roughness 1, and 01 paving-boundary failures.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Uses 0.25m earth.png on site earth/ground and base color on planter/censer soil parts, comparing at 01 paving boundaries.
@evidence principles/design/materials.md#material-construction-appearance Base color/0.25m foreground repeat changes neither grade nor pot depth.
@evidence principles/design/materials.md#material-binding-interface Distinguishes site earth/ground and soil/ash parts from separately keyed distant ridge.
@evidence principles/design/materials.md#material-verification-address 01 paving/03 fountain/planter views test distinct dry soil.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Site/model already own grade/depth and distinct earth/ridge IDs; repeat binds existing UV0 without height repairs.
@evidence settings/40-environment.md#site Site earth/ground use soil; stone paths retain paving.
@evidence spaces/site.md#site-grade Consumes existing sloped-earth UV0 without changing grade.
-->

Assign `soil` to site `earth`/`ground`, distant foothill `ground`, planter `soil`, and censer `ash`/`incense`. Base `#8c795c`, roughness 1, metalness 0, opacity 1. Foreground `earth.png` repeats 0.25m×0.25m; small vessel soil may use base color only. Spaces owns levels/paving boundaries. Image 01 tests distinct earth/path/wall bands without soil spreading into fountain.

## Low distant ridge {#distant-ridge}

<!--
@evidence principles/core/common.md#declared-basis Consumes distant-terrain settings and site ridge surface for a solid-color key.
@evidence principles/core/common.md#scope-preservation Limits distant-earth to surface.site-distant.ridge without geometry/placement/neighbor finish changes.
@evidence principles/core/common.md#substantive-completion Defines untextured #827e69 with roughness 1 on surface.site-distant.ridge; stronger contrast than the gable or a flat photographic backdrop fails in exterior view 01.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Derives ridge response/observations from settings/site, failing stronger contrast than gables or photographic texture in 01.
@evidence principles/design/materials.md#material-construction-appearance Low-saturation matte solid color does not bring distant texture into foreground detail.
@evidence principles/design/materials.md#material-binding-interface Uses only ridge; site-distant.ground remains soil.
@evidence principles/design/materials.md#material-verification-address 01 distant view tests dominant contrast or photographic texture.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Ridge/ground already have separate IDs; matte color requires no height/silhouette changes.
@evidence settings/40-environment.md#distant-terrain Uses low-saturation distant-earth to separate ridge depth from foreground earth.
@evidence spaces/site.md#distant-ridge Assigns distant-earth to ridge and soil to its background ground.
-->

Assign `distant-earth` only to `surface.site-distant.ridge`: base `#827e69`, roughness 1, metalness 0, opacity 1, no bitmap. Low-saturation gray-brown is an authored receding-background choice, not horizon water or regional geology. In image 01 exterior views, stronger ridge contrast than gables or a flat photographic-background appearance fails.

## Tree crowns and grass {#foliage}

<!--
@evidence principles/core/common.md#declared-basis Consumes vegetation/cypress crown, also assigning the same key to broad-tree crown/grass blades.
@evidence principles/core/common.md#scope-preservation Limits foliage to crowns/blades without geometry/placement/neighbor-finish changes.
@evidence principles/core/common.md#substantive-completion Defines #526448, roughness 1, repeat length 0.28m, and no leaf photographs for crown/blade; 01/03 reject foliage reading as plaster while models retain crown gaps and silhouettes.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Derives foliage response from vegetation/crown inputs and tests vertical-canopy/low-grass depth distinct from plaster in 01/03.
@evidence principles/design/materials.md#material-construction-appearance Matte green is neither leaf photography nor extra branches.
@evidence principles/design/materials.md#material-binding-interface Consumes crown/blade separately from trunk/branch timber.
@evidence principles/design/materials.md#material-verification-address 01/03 tests canopy/grass depth against plaster.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing crown/blade/trunk/branch parts need no model/instance changes for leaf color; this key determines neither silhouette nor count.
@evidence settings/40-environment.md#vegetation Crowns/blades use matte foliage, distinct from timber trunks/branches.
-->

Assign `foliage` to `crown`/`blade`: base `#526448`, roughness 1, metalness 0, opacity 1, repeat 0.28m. Models/instances own spacing/silhouette; material promises no leaf photographs. Images 01/03 test dark vertical crowns and gray-green surroundings through lighting/placement differences; plaster-like foliage fails.

## Fountain water {#water}

<!--
@evidence settings/30-interiors.md#services Labels only fixed-level fountain water, without new hidden pipes/pump-room properties.
@evidence principles/core/common.md#declared-basis Consumes fixed fountain settings and water/ripple/jet parts.
@evidence principles/core/common.md#scope-preservation Limits water to three fountain parts without geometry/placement/neighbor-finish changes.
@evidence principles/core/common.md#substantive-completion Defines untextured #668b91, roughness 0.20, opacity 1, and repeat length 0.50m for water/ripple/jet; loss of their boundary against basin stone fails in 03, without claiming refraction or flow.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Uses blue-gray water/0.20 roughness and checks stone-rim boundary in 03 courtyard.
@evidence principles/design/materials.md#material-construction-appearance Color/0.20 roughness describes static prototype water, not circulation simulation.
@evidence principles/design/materials.md#material-binding-interface Consumes water/ripple/jet; basin-inner/rim remain limestone.
@evidence principles/design/materials.md#material-verification-address 03 courtyard fails vanished basin-stone/water boundaries.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing stone/water parts are separate; color/roughness requires no new level or plumbing design.
@evidence settings/30-interiors.md#fountain Fountain water/ripple/jet use water; rim/basin-inner remain limestone.
-->

Assign `water` to fountain `water`/`ripple`/`jet`: base `#668b91`, roughness 0.20, metalness 0, opacity 1, repeat 0.50m. Fixed models guarantee neither refraction nor time variation. Models own water/jet above stone `basin-inner`/`rim`; finish distinguishes it by blue-gray/low roughness. Vanished stone/water boundary in image 03 fails.
