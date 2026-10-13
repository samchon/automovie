# Fixed objects placed by room

These are explicit placement inputs for props after building completion. This document owns roles, counts, horizontal positions, rotations, and support relations; parents own geometry, parts, UV0, and materials. Every scale is 1, parent temple.root, and space the listed room. One stationary tier uses no randomness, seed, or LOD changes. Coordinates are world X/Z metres; yaw is Y-axis radians. Floor objects use translationY=floor−actual minY; supported objects use hostTranslationY+selected part height−actual minY. If support height is supplied, choose that plate/sill height within the part; otherwise use maxY. Create supports before children, while roles remain independent of order. Tables are closed explicit-role inputs; repeated objects follow only the prose formula.

## Sanctuary axis and low ritual fixtures {#sanctuary}

<!--
@evidence principles/core/common.md#declared-basis Uses sanctuary north-axis/access reservations and altar platform occupancy 2.4×1.6m to choose center Z=-7.7m.
@evidence principles/core/common.md#scope-preservation Allocates ten roles covering altar, niche vessel, bilateral lamps, three tabletop objects, and two floor cushions rather than only an altar.
@evidence principles/core/common.md#substantive-completion Defines cloth Z=-7.75m and niche sill 0.75m, leaving no arbitrary cloth size or supporting surface to implementation.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds X=0/Z=-7.7m and actual rear 1.15m/front 2.75m clearances to the parent north-axis altar reservation.
@evidence principles/design/instances.md#instance-prototype-boundary Names ritual.floor-cushion separately from portable.textile.small; no cloth scaling override substitutes for a cushion.
@evidence principles/design/instances.md#instance-derivation-authority Selects the recess-frame sill at 0.75m for the vessel, without treating its upper plate maxY as another support.
@evidence principles/design/instances.md#instance-verification-address Door-axis views test niche hierarchy, cushion close-ups their 0.64m gap, and altar-top views cloth front overhang.
@evidence obligations/design/instances.md#addressable-instance-decisions This sanctuary H2 owns altar-axis/niche-contact/floor-cushion placement independently of offering-table placement.
@evidence obligations/design/instances.md#instance-prototype-membership Ten closed roles sanctuary.altar through cushion.east have formal model IDs; only lampstands/cushions repeat their prototypes twice.
@evidence obligations/design/instances.md#instance-identity-transform West/east lamps use roles/X signs rather than generation order, reproducing X=±1.8m at the same Z under temple.root with unit scale.
@evidence obligations/design/instances.md#instance-variation-tiers Only the cloth uses the existing small variant; paired lamps/cushions share prototypes without close-view asset swaps.
@evidence obligations/design/instances.md#instance-placement-review Compares platform ends/north wall, central swing, two cushions, and three tabletop objects for blocked approach by the widest platform.
@evidence settings/30-interiors.md#sanctuary Places rear niche/vessel behind the altar, using a stone axis and bilateral lamps instead of a human idol or work desk.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume Rear-wall/platform clearance 1.15m and south-wall/platform clearance 2.75m exceed reserved 0.7m/1.5m; cushions avoid the direct south door.
@evidence spaces/storey.md#ground-storey Platform belongs inside fixture.altar; place the prototype on Y=0 without adding its 0.15m step height again to translation.
@evidence materials/10-model-bindings.md#binding-map Altar top/support/step use limestone, censer cup dark-metal, ash/incense soil; shared support does not turn entire children into stone.
@evidence models/fixtures.md#altar Consumes top local Z=-0.20m for bowl/censer world Z=-7.9m; cloth width 0.42m/depth 0.36m receives a position inside the top.
@evidence models/fixtures.md#niche Fits the niche rear-edge origin to north wall Z=-9.65m, bringing the vessel forward to Z=-9.37m within the recess.
@evidence models/fixtures.md#lampstand Places two 1.15m-high floor-centered lampstands outside the platform at X=±1.8m, showing dishes slightly above the altar top.
@evidence models/wares.md#small-vessel A 0.20m small vessel contacts the 0.75m lower niche sill; do not shrink a storage jar into the niche.
@evidence models/wares.md#offering-bowl Fits actual bowl minY to altar top 1.10m, avoiding a floating bowl from its 0.01m bottom/origin difference.
@evidence models/portable.md#textile Places one small cloth rightward at X=0.4m/Z=-7.75m, keeping both ends inside the top without covering bowl center.
@evidence models/ritual.md#censer Fits censer feet to altar top, revealing cup/three unlit incense sticks in a distinct place 0.4m left of the bowl.
@evidence models/ritual.md#floor-cushion Places two 0.46m-wide cushions 1.10m center-to-center before the altar, preserving the local rear-fold direction.
@evidence settings/35-objects.md#altar Assigns one shallow bowl above the altar with independent platform/two supports, without substituting the low long offering table.
@evidence settings/35-objects.md#lampstands Broad lampstand feet meet the floor; both dishes stand unlit beside the altar.
@evidence settings/35-objects.md#vessels Gives the small red-brown niche vessel and shallow metal altar bowl distinct roles/sizes/functions.
@evidence settings/35-objects.md#textile Altar cloth remains tabletop equipment; floor seating remains separate cushions.
@evidence settings/35-objects.md#censer Fixes one censer left of the altar, without smoke, flame, or ritual action.
@evidence settings/35-objects.md#floor-cushion Places two low cushions at front-floor Z=-6.1m, flanking the activity area rather than substituting administrative/reading stools.
@evidence materials/00-surface-palette.md#stone All altar/niche stone parts retain light limestone distinct from red dado; cushions do not become stone.
@evidence materials/00-surface-palette.md#metal Retains dark-metal for lamps, censer metal, and bowl, comparing dish/cup response under the same daylight.
@evidence materials/00-surface-palette.md#ceramic Only niche vessel body/handle uses terracotta, distinct from the metal bowl.
@evidence materials/00-surface-palette.md#textile Cloth and cushion base/pad/fold may share linen while retaining prototype positions/thickness; 0.25m weave does not fake height.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Compared 2.4m platform, 1.24m niche, 0.26m lamp feet, and cushions with reservations. Cloth front escape was repaired by this H2's Z=-7.75m choice, leaving parent dimensions/boundaries/materials intact.
-->

The altar platform centered at (0,−7.7)m has rear Z=−8.5m, leaving 1.15m to the north wall, and front Z=−6.9m, leaving 2.75m of activity depth to the south wall. Niche rear edge meets Z=−9.65m; its vessel rests on lower sill Y=0.75m. Lampstands stand at X=±1.8m. Separate bowl, censer, and small cloth on the altar. Two cushion centers X=±0.55m leave 0.64m between them. Inspect all fixtures/contacts from central door axis, altar-front 3/4, niche front, and cushion close-ups.

| role | model ID | X/Z, yaw, and support inputs |
| --- | --- | --- |
| `sanctuary.altar` | `fixture.altar` | `0,-7.7` |
| `sanctuary.niche` | `fixture.niche` | `0,-9.65` |
| `sanctuary.niche-vessel` | `ware.small-vessel` | `0,-9.37,0,atop("sanctuary.niche","recess-frame",0.75)` |
| `sanctuary.lamp.west` | `fixture.lampstand` | `-1.8,-7.7` |
| `sanctuary.lamp.east` | `fixture.lampstand` | `1.8,-7.7` |
| `sanctuary.bowl` | `ware.offering-bowl` | `0,-7.9,0,atop("sanctuary.altar","top")` |
| `sanctuary.censer` | `ritual.censer` | `-0.4,-7.9,0,atop("sanctuary.altar","top")` |
| `sanctuary.cloth` | `portable.textile.small` | `0.4,-7.75,0,atop("sanctuary.altar","top")` |
| `sanctuary.cushion.west` | `ritual.floor-cushion` | `-0.55,-6.1` |
| `sanctuary.cushion.east` | `ritual.floor-cushion` | `0.55,-6.1` |

## Long offering table and wall displays {#offering}

<!--
@evidence principles/core/common.md#declared-basis Uses offering north/west display reservations and offering-table Z length to set table (-7.7,0)m and north shelf (-7.5,-9.63)m.
@evidence principles/core/common.md#scope-preservation Eleven roles cover central stone table, two wall shelves, different-sized vessels, tray, plaque, cloth, and lamp, retaining displays and bilateral use.
@evidence principles/core/common.md#substantive-completion Does not apply maxY to all four board plates: selects 0.58m for small vessel and 1.40m for plaque/large carry jar.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds shelf orientations, table→tray→bowl support chain, and object-specific board heights to long-table/wall-display parents.
@evidence principles/design/instances.md#instance-prototype-boundary Rotates two offering shelf variants without reducing board height or jar size to squeeze plaques into low bays.
@evidence principles/design/instances.md#instance-derivation-authority Tray uses table.top and bowl uses tray.floor as one support chain, without competing separately derived bowl heights.
@evidence principles/design/instances.md#instance-verification-address The tallest west-shelf carry jar tests upper-board penetration; tray-bowl top views test floor contact.
@evidence obligations/design/instances.md#addressable-instance-decisions Owns two wall displays/central table separately from administration's short shelf/single writing desk.
@evidence obligations/design/instances.md#instance-prototype-membership Two shelves share fixture.display-shelf.offering; tray/tray-bowl bind portable.offering-tray/ware.offering-bowl among eleven closed roles.
@evidence obligations/design/instances.md#instance-identity-transform West shelf +π/2 and north yaw=0 fix wall orientation; stable roles do not depend on world positions or generation order.
@evidence obligations/design/instances.md#instance-variation-tiers Uses existing standard cloth/offering shelf, without ceramic recoloring of bowls, hero overrides, or distance swaps.
@evidence obligations/design/instances.md#instance-placement-review Checks door Z=2.175m, table-side paths, plaque height 0.42m/jar 0.50m against bays to reject long objects in undersized cells.
@evidence settings/30-interiors.md#offering-room Divides a long low Z-axis stone table from north/west timber displays, preserving the direct doorway and communal use.
@evidence spaces/rooms/offering.md#offering-volume Attaches shelves only to north/west walls without a rear room, retaining both longitudinal-end observations.
@evidence spaces/storey.md#ground-storey Table/shelf bases use Y=0; top 0.82m/board levels are prototype local heights, not courtyard -0.12m.
@evidence materials/10-model-bindings.md#binding-map Tray floor/rim and bowl use dark-metal; shelf side/board dark-wood; support contact does not merge surface IDs.
@evidence models/fixtures.md#offering-table Separates tray/small vessel/cloth along the 0.75m-wide, 2.20m-long top at 0.82m, leaving both sides usable.
@evidence models/fixtures.md#display-shelf Rear-edge origins stand 0.02m off walls; actual support options 0.13/0.58/1.03/1.40m retain empty bays.
@evidence models/wares.md#carry-jar Places the 0.50m carry jar on top board 1.40m to repair penetration caused by its height exceeding 0.45m board spacing.
@evidence models/wares.md#small-vessel Gives 0.20m table and north 0.58m-board vessels separate roles using the same prototype, distinct from large jars.
@evidence models/wares.md#offering-bowl The shallow 0.22m bowl centers inside tray 0.49×0.31m and minY correction seats it on tray.floor at 0.838m.
@evidence models/portable.md#offering-tray Places 0.52×0.34m tray on table.top and selects only its floor as bowl host, without lifting the bowl onto the rim.
@evidence models/portable.md#votive-plaque Stands blank 0.42m plaque independently at X=-7.8m on the north top board, not inside a 0.34m middle bay.
@evidence models/portable.md#portable-lamp Places 0.28m lamp on west board 0.58m, leaving its dish below the next underside 1.00m.
@evidence models/portable.md#textile Places standard 0.55×0.40m cloth at south table Z=0.65m without overlapping tray/vessel occupancy.
@evidence settings/35-objects.md#offering-table Uses one low long offering table instead of the raised altar platform, preserving between-leg and side-use voids.
@evidence settings/35-objects.md#shelves Wide open offering display bays do not substitute the records 4×5 cubby prototype.
@evidence settings/35-objects.md#vessels Two small tabletop ceramics, one large carry jar, and one shallow bowl retain distinct positions/open mouths.
@evidence settings/35-objects.md#offering-tray The separate tray receives one bowl within four low rims; a round bowl is not itself called a tray.
@evidence settings/35-objects.md#votive-plaque Stands a blank plaque on the north top shelf without adding a large inscription to the central table.
@evidence settings/35-objects.md#portable-lamp One low dish lamp is unlit/unfueled shelf equipment, distinct in size from sanctuary floor lampstands.
@evidence settings/35-objects.md#textile One thin folded cloth preserves gaps between small table offerings.
@evidence materials/00-surface-palette.md#stone Table top/trestles and plaque base/slab share light limestone while retaining independent parts/contacts.
@evidence materials/00-surface-palette.md#timber Both shelf side/boards use 1m dark-wood repeat without transferring timber grain to the central stone top.
@evidence materials/00-surface-palette.md#metal Compares dark-metal tray/bowl/lamp response against ceramics under one exposure; a black silhouette does not prove material implementation.
@evidence materials/00-surface-palette.md#ceramic Only three differently sized ceramic body/handles use 0.22m terracotta repeat; tray-bowl remains metal.
@evidence materials/00-surface-palette.md#textile Applies thin linen weave to south table cloth without using its texture to hide tray/top geometry.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 0.50m jars/0.42m plaques cannot fit 0.45m board intervals without considering bay clearance; selecting top 1.40m resolves placement without changing prototypes, rooms, or allowed materials.
-->

The table at (−7.7,0)m retains its Z length, leaving both side paths and door Z=2.175m clear. North/west shelves stand 0.02m off walls facing the room. Offering board tops are 0.13/0.58/1.03/1.40m; select only listed support heights. The bowl contacts tray.floor; plaque, small ceramic, lamp, and carry jar receive distinct bay positions. Thresholds, both long ends, shelf fronts, and table-top views examine the low table, ceramic size differences, metal bowl, and member contacts.

| role | model ID | X/Z, yaw, and support inputs |
| --- | --- | --- |
| `offering.table` | `fixture.offering-table` | `-7.7,0` |
| `offering.shelf.west` | `fixture.display-shelf.offering` | `-9.88,-6.5,Math.PI/2` |
| `offering.shelf.north` | `fixture.display-shelf.offering` | `-7.5,-9.63` |
| `offering.tray` | `portable.offering-tray` | `-7.7,-0.55,0,atop("offering.table","top")` |
| `offering.tray-bowl` | `ware.offering-bowl` | `-7.7,-0.55,0,atop("offering.tray","floor")` |
| `offering.small-vessel` | `ware.small-vessel` | `-7.7,0.1,0,atop("offering.table","top")` |
| `offering.cloth` | `portable.textile.standard` | `-7.7,0.65,0,atop("offering.table","top")` |
| `offering.plaque` | `portable.votive-plaque` | `-7.8,-9.43,0,atop("offering.shelf.north","board",1.40)` |
| `offering.shelf-vessel` | `ware.small-vessel` | `-7.1,-9.43,0,atop("offering.shelf.north","board",0.58)` |
| `offering.shelf-jar` | `ware.carry-jar` | `-9.68,-6.1,Math.PI/2,atop("offering.shelf.west","board",1.40)` |
| `offering.lamp` | `portable.lamp` | `-9.68,-6.8,0,atop("offering.shelf.west","board",0.58)` |

## One writing desk and its tools {#administration}

<!--
@evidence principles/core/common.md#declared-basis Interprets office east-desk/west-stool reservations as (9.2,7.5)/(8.35,7.5)m, using writing top 0.75m for height.
@evidence principles/core/common.md#scope-preservation Ten roles include one desk/stool, open sheet, tablet, stylus, tool vessel, and short-shelf cloth/ceramic/lamp for small-scale writing.
@evidence principles/core/common.md#substantive-completion Defines desk +π/2, south shelf π, distinct tool X/Z, and shelf 0.13/0.68m plates rather than inventing alignment in implementation.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds writing center (9.12,7.25)m and tablet (9.18,7.75)m to separate contents on the same 0.75m worktop.
@evidence principles/design/instances.md#instance-prototype-boundary Writing desk, administration shelf, and open scroll are named parent variants; no scaled records cubbies substitute for this shelf.
@evidence principles/design/instances.md#instance-derivation-authority All four desk props derive Y only from administration.desk/top; common minY contact handles sheet and center-origin stylus differences.
@evidence principles/design/instances.md#instance-verification-address Door→stool and desk→door views test withdrawal collisions, close top views tool overlap, and shelf front small-cloth overhang.
@evidence obligations/design/instances.md#addressable-instance-decisions Ten writing roles remain independent from records twenty-cubby repetition, allowing separate workplace density decisions.
@evidence obligations/design/instances.md#instance-prototype-membership Exactly one ware.scroll.open; tool-vessel and shelf-vessel share ware.small-vessel as different roles.
@evidence obligations/design/instances.md#instance-identity-transform Desk/tablet/stylus +π/2 align their long axes to world Z; stool role remains (8.35,7.5)m regardless of creation order.
@evidence obligations/design/instances.md#instance-variation-tiers Fixes writing desk/administration shelf variants and one open sheet, without increased text, color, or tool density in close views.
@evidence obligations/design/instances.md#instance-placement-review Compares longest open-sheet depth around 0.4074m with desk depth 0.60m and tests overlap of west stool withdrawal/south door swing.
@evidence settings/30-interiors.md#administration One open work sheet and small tool vessel occupy the desk; only a short wall shelf adds ceramics, distinguishing writing from accumulated scroll storage.
@evidence spaces/rooms/administration.md#office-volume Places desk near east wall and stool west, accessible from direct west door; creates no north records connecting door or new entrance.
@evidence spaces/storey.md#ground-storey Desk/stool/shelf bases meet Y=0; props add actual host top/board heights rather than only storey level.
@evidence materials/10-model-bindings.md#binding-map Tablet frame uses dark-wood, writing-face/open sheet parchment, stylus shaft/tip dark-metal rather than one timber desktop material.
@evidence models/fixtures.md#desk Four tools consume the 1.10×0.60m writing top at 0.75m; stool stands 0.85m west, outside desk legs.
@evidence models/fixtures.md#stool Stool seat 0.45m stands 0.30m below desk with west approach, without instance-added backrest/cushion.
@evidence models/fixtures.md#display-shelf Rotates the 1m-wide/0.30m-deep south shelf northward, consuming lower 0.13m/middle 0.68m plates of three.
@evidence models/wares.md#scroll Fits actual open-sheet minimum, including rolled ends, to the same 0.75m writing datum without floating.
@evidence models/wares.md#small-vessel Tool vessel (9.39,7.15)m occupies a different desk corner from the sheet; shelf vessel (8.45,9.48)m is a separate quantity.
@evidence models/portable.md#stylus Rotates the center-origin 0.22m stylus +π/2 and corrects actual minY so its pointed metal form is not buried below the desk.
@evidence models/portable.md#writing-tablet Places a 0.28×0.22m shallow tablet frame south of the sheet with separate blank writing-face occupancy.
@evidence models/portable.md#textile Middle-shelf small cloth rotates +π/2: length 0.42m exceeds shelf depth 0.30m by 0.06m each end while its center contacts the board; no complete planar containment claim.
@evidence models/portable.md#portable-lamp Places the 0.28m lamp at X=8.42m right of middle-board cloth, fitting below the upper plate.
@evidence settings/35-objects.md#workstation One writing desk/stool pair preserves withdrawal toward the passage, without sitting action.
@evidence settings/35-objects.md#shelves A short south shelf for a few ceramics retains two open bays, not copied records cubbies.
@evidence settings/35-objects.md#scrolls One open stationary work sheet distinguishes administration from shelves densely stacked with rolled records.
@evidence settings/35-objects.md#vessels Two 0.20m small vessels have desk/shelf roles instead of tall storage jars, without added liquid.
@evidence settings/35-objects.md#stylus One short stationary stylus adds no hand, writing marks, or readable text.
@evidence settings/35-objects.md#writing-tablet An independently placed blank tablet distinguishes work tools without fake prose.
@evidence settings/35-objects.md#textile Shelf cloth remains thin equipment, not stool padding or sanctuary floor seating.
@evidence settings/35-objects.md#portable-lamp One unlit metal shelf lamp does not conceal deficient daylight with flame.
@evidence materials/00-surface-palette.md#timber Desk/stool/shelf/tablet-frame timber remains behind light record surfaces; ceramic vessels receive no 1m timber grain.
@evidence materials/00-surface-palette.md#metal Close views distinguish stylus rod/lamp dish dark-metal responses; metalness 0.82 is not substituted by a ceramic color.
@evidence materials/00-surface-palette.md#ceramic Desk/lower-shelf vessel body/handles remain matte red-brown, unlike lamp dishes.
@evidence materials/00-surface-palette.md#parchment Open sheet/tablet face use light yellow-brown blank parchment, distinct from timber frames without text bitmaps.
@evidence materials/00-surface-palette.md#textile Only middle-board cloth receives linen weave, following its rotated prototype UV direction.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Four tools fit 0.60m desk depth; west stool/south shelf preserve office withdrawal. The cloth 0.06m end overhang retains central contact without changing board size or prototype scale.
-->

Rotate the desk near the east wall at (9.2,7.5)m +90°, with stool west at (8.35,7.5)m accessible from the door. Separate scroll, tablet, stylus, and small tool vessel on top 0.75m. The short south-wall shelf faces north and holds only a few ceramics, lamp, and cloth. Administration plate tops are 0.13/0.68/1.20m. Middle-plate small cloth rotated π/2 has 0.42m length over 0.30m depth, projecting 0.06m at each end while retaining central contact over 0.30m. Inspect door-to-stool and reverse paths, close worktop, and shelf front for a writing room distinct from records.

| role | model ID | X/Z, yaw, and support inputs |
| --- | --- | --- |
| `administration.desk` | `fixture.desk.writing` | `9.2,7.5,Math.PI/2` |
| `administration.stool` | `fixture.stool` | `8.35,7.5` |
| `administration.shelf` | `fixture.display-shelf.administration` | `8.2,9.63,Math.PI` |
| `administration.scroll` | `ware.scroll.open` | `9.12,7.25,Math.PI/2,atop("administration.desk","top")` |
| `administration.tablet` | `portable.writing-tablet` | `9.18,7.75,Math.PI/2,atop("administration.desk","top")` |
| `administration.stylus` | `portable.stylus` | `9.38,7.7,Math.PI/2,atop("administration.desk","top")` |
| `administration.tool-vessel` | `ware.small-vessel` | `9.39,7.15,0,atop("administration.desk","top")` |
| `administration.cloth` | `portable.textile.small` | `7.98,9.48,Math.PI/2,atop("administration.shelf","board",0.68)` |
| `administration.shelf-vessel` | `ware.small-vessel` | `8.45,9.48,0,atop("administration.shelf","board",0.13)` |
| `administration.lamp` | `portable.lamp` | `8.42,9.48,0,atop("administration.shelf","board",0.68)` |

## Twenty scroll cells and a reading place {#records}

<!--
@evidence principles/core/common.md#declared-basis Uses four columns/five tiers of scroll-shelf voids and 0.288m scroll length to choose one member per cell and parity-based variants.
@evidence principles/core/common.md#scope-preservation Owns twenty dry records plus front access, closed chest, reading desk/stool/tools, preserving both storage and reading.
@evidence principles/core/common.md#substantive-completion Five heights times four X offsets, i+j parity, and Z=2.07m fully define twenty variants/contacts without per-cell quantity invention.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds alternating 10 rolled/10 bundle positions and north-shelf/east-reading/chest coordinates to parent 4×5 cells/cylinder length.
@evidence principles/design/instances.md#instance-prototype-boundary Uses only formal rolled/bundle prototypes; no placement scale or Y override repairs the bundle tie path.
@evidence principles/design/instances.md#instance-derivation-authority Tier/cell inputs and parity are the sole membership authority, without separately listed twenty output coordinates.
@evidence principles/design/instances.md#instance-verification-address Top tier-4 bundle tests height/upper-board clearance; tier close-ups test floor contact; twenty-cell front tests omissions, duplicates, and parity.
@evidence obligations/design/instances.md#addressable-instance-decisions Records owns cubby storage/reading relation independently of administration open-sheet coordinates.
@evidence obligations/design/instances.md#instance-prototype-membership Twenty tier-0..4×cell-0..3 roles are distinct from eight table roles; scroll entry/variant depend only on i+j.
@evidence obligations/design/instances.md#instance-identity-transform IDs records.scroll.tier-i.cell-j preserve cell numbering with X=7.8+offset, Z=2.07, yaw=0 independent of tier evaluation order.
@evidence obligations/design/instances.md#instance-variation-tiers Rolled/bundle are named states; reading desk is a named size variant, without distance-based paper density or hero records.
@evidence obligations/design/instances.md#instance-placement-review Compares around 0.41m cell width/0.288m length and 0.30m height/bundle occupancy, plus 0.9m front access, chest frontage, and stool approach.
@evidence settings/30-interiors.md#records Dry scroll shelves, a low locking chest, and small east reading desk express storage/reading without water ingress.
@evidence spaces/rooms/records.md#records-volume Keeps north-shelf front clear, reading desk/chest eastward, accommodating west-door swing without passing through another workplace.
@evidence spaces/storey.md#ground-storey Shelf/chest/desk/stool bases meet Y=0; scroll heights 0.04~1.36m are local shelf boards, not storeys.
@evidence materials/10-model-bindings.md#binding-map Scroll sheet-1/2/3 use parchment and tie rope-fibre; chest body/lid timber stays separate from metal hasp/strap.
@evidence models/fixtures.md#scroll-shelf Consumes four cell centers -0.6575/-0.21875/+0.21875/+0.6575m across 1.80m shelf at rear edge (7.8,1.87)m.
@evidence models/fixtures.md#chest Rotates closed chest at (9.4,2.95)m by -π/2, facing hasp inward and using lid for small cloth.
@evidence models/fixtures.md#desk Places reading 0.90×0.55m top at (9.15,4.3)m/+π/2; three tools use actual top 0.72m.
@evidence models/fixtures.md#stool Stool seat 0.45m is 0.27m below reading top, westward at X=8.35m outside desk legs.
@evidence models/wares.md#scroll Corrects distinct actual rolled/bundle minY from center origins to cell floors; a three-scroll bundle counts as one rendered member.
@evidence models/portable.md#stylus Fixes 0.22m stylus +π/2 at (9.32,4.25)m using a separate work region from the tablet.
@evidence models/portable.md#writing-tablet Places blank shallow tablet at (9.15,4.05)m, separated in Z from the desk rope coil.
@evidence models/portable.md#textile Small cloth contacts closed chest lid using chest Y+actual lid maxY, not the reading desk or floor datum.
@evidence models/portable.md#rope-coil Places separate three-loop coil south on desk at (9.12,4.5)m, distinct from built-in scroll ties.
@evidence settings/35-objects.md#shelves Fixes one small-cubby records shelf northward instead of wide offering display bays.
@evidence settings/35-objects.md#chests One closed timber chest shows front locks, without opening animation or unseen contents.
@evidence settings/35-objects.md#workstation One reading desk/stool pair differs from administration writing and preserves west withdrawal.
@evidence settings/35-objects.md#scrolls Alternating single rolled/three-scroll bundles in twenty cells give regular storage; no open work sheets stack on shelves.
@evidence settings/35-objects.md#stylus Places one stationary reading stylus without writing action or prose.
@evidence settings/35-objects.md#writing-tablet Blank tabletop tablet remains separate from stored scroll cells.
@evidence settings/35-objects.md#textile Small folded lid cloth does not become a pile covering stool/all shelves.
@evidence settings/35-objects.md#rope-coil The desk-end coil is distinct from document ties and asserts no actual binding tension.
@evidence materials/00-surface-palette.md#timber Shelf frame/board/divider, chest, desk, and stool retain dark timber behind light records.
@evidence materials/00-surface-palette.md#metal Only chest hasp/strap and stylus are bronze-like; closed lid does not become a shiny metal sheet.
@evidence materials/00-surface-palette.md#parchment Twenty sheet variants/tablet writing-face share light parchment without text or personal-data textures.
@evidence materials/00-surface-palette.md#textile Only chest cloth has weave; scroll cylinders do not inherit linen.
@evidence materials/00-surface-palette.md#rope-fibre Bundle ties/separate coil share dry fibre color without merging addresses with light sheets.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work All twenty cells fit 0.288m lengths/bundle heights; 0.9m access and east reading fit reservations. The former tie-source error contradicted already-authored rounded-triangle geometry and was repaired in source, not by revising parent count/cell boundaries.
-->

North-shelf rear edge is (7.8,1.87)m. Combine five support heights 0.04/0.37/0.70/1.03/1.36m with four X offsets −0.6575/−0.21875/+0.21875/+0.6575m. For records.scroll.tier-i.cell-j, even i+j selects rolled and odd selects bundle, aligned along X at Z=2.07m. The 20 members comprise 10 rolled and 10 bundles, correcting actual minY to board heights. Preserve 0.9m front access/door swing; reading desk, stool, and closed chest sit eastward. Create no output list beyond the table. Inspect all members/contacts from the 20-cell front, every tier close-up, desk top, and chest front.

| role | model ID | X/Z, yaw, and support inputs |
| --- | --- | --- |
| `records.shelf` | `fixture.scroll-shelf` | `7.8,1.87` |
| `records.chest` | `fixture.chest` | `9.4,2.95,-Math.PI/2` |
| `records.desk` | `fixture.desk.reading` | `9.15,4.3,Math.PI/2` |
| `records.stool` | `fixture.stool` | `8.35,4.3` |
| `records.tablet` | `portable.writing-tablet` | `9.15,4.05,Math.PI/2,atop("records.desk","top")` |
| `records.stylus` | `portable.stylus` | `9.32,4.25,Math.PI/2,atop("records.desk","top")` |
| `records.cloth` | `portable.textile.small` | `9.4,2.95,0,atop("records.chest","lid")` |
| `records.rope` | `portable.rope-coil` | `9.12,4.5,0,atop("records.desk","top")` |

## Wall-side vessels and two support types {#storage}

<!--
@evidence principles/core/common.md#declared-basis Uses storage north/east reservations/west delivery, jar-rack centers ±0.29m, and jar-stand ring 0.34m for two support chains.
@evidence principles/core/common.md#scope-preservation Ten objects include three storage jars/one carry jar, two support types, chest, cloth, basket, and coil while preserving central delivery.
@evidence principles/core/common.md#substantive-completion Specifies two wells X=7.11/7.69m/Y=0.268m, single ring 0.34m, and chest-lid cloth hosts rather than guessing supports.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds different-size jars on two wells plus northeast single stand/east floor positions to parent wall storage/well geometry.
@evidence principles/design/instances.md#instance-prototype-boundary Rack/stand are independent prototypes; size difference selects storage-jar/carry-jar rather than nonuniform scaling.
@evidence principles/design/instances.md#instance-derivation-authority Rack children use actual well maxY and stand child ring top; floor storage.jar consumes neither support height.
@evidence principles/design/instances.md#instance-verification-address Rack top tests well/foot contact, east close-up largest-jar wall penetration, and threshold central-delivery obstruction.
@evidence obligations/design/instances.md#addressable-instance-decisions Storage owns two-place/single-place chains separately from laid-down yard objects or courtyard waiting fixtures.
@evidence obligations/design/instances.md#instance-prototype-membership West rack jar uses ware.storage-jar, east ware.carry-jar; stand/floor storage jars have distinct stable roles.
@evidence obligations/design/instances.md#instance-identity-transform Rack center X=7.4m plus parent well offsets ±0.29m derives child X; west/east roles/support addresses reproduce them.
@evidence obligations/design/instances.md#instance-variation-tiers Allows large storage/medium carry variants and standard chest cloth without per-well assets or color tiers.
@evidence obligations/design/instances.md#instance-placement-review Compares largest stand foot 0.60m/jar belly with door→(7.8,-0.3)m delivery envelope, including children blocking otherwise-clear supports.
@evidence settings/30-interiors.md#storage Ceramic sizes, closed chest, and dry basket occupy north/east walls as storage distinct from records cubbies.
@evidence spaces/rooms/storage.md#storage-volume North supports/east chest/vessels remain in wall reservations, clearing the 0.8m carrying envelope from west door to center.
@evidence spaces/storey.md#ground-storey Rack/stand/floor jar/chest use indoor Y=0; supported children add host height without a local storey.
@evidence materials/10-model-bindings.md#binding-map Rack top/leg/well retain dark-wood and stand foot/post/ring limestone despite both supporting jars.
@evidence models/fixtures.md#chest Closed southeast chest (9.3,1.1)m lid supports standard cloth without interior storage void/open-lid state.
@evidence models/wares.md#storage-jar Three large jars share unchanged body/handle prototypes across west well, independent stand, and east floor datums.
@evidence models/wares.md#carry-jar The 0.50m carry jar sits on east well 0.268m, not a symmetrical scaled model of the large storage jar.
@evidence models/wares.md#basket Open basket sits eastward at (9.4,0.3)m with a low broad mouth distinct from chest/jars.
@evidence models/portable.md#jar-rack Uses well centers ±0.29m and floor 0.268m rather than floating children on top 0.28m.
@evidence models/portable.md#textile One standard lid cloth does not close vessel mouths or wells with an airborne sheet.
@evidence models/portable.md#rope-coil Separate coil at floor (8.7,1.2)m sits southeast of delivery, without physical jar binding.
@evidence models/ritual.md#jar-stand Places 0.60m-diameter foot at northeast (9.35,-1.6)m with one jar on ring 0.34m, distinct from two-well rack.
@evidence settings/35-objects.md#chests Closed chest shows front hardware from its floor position without lid operation/contents.
@evidence settings/35-objects.md#vessels Large storage/handled carry jars stay north/east without water turning the room into utilities.
@evidence settings/35-objects.md#baskets One dry yellow-brown basket with low broad mouth reads outside delivery beside ceramics.
@evidence settings/35-objects.md#jar-rack Consumes actual nonpenetrating contact of two vessels with timber rack wells.
@evidence settings/35-objects.md#textile Limits cloth to folded chest covering without scrolls/cushions in storage.
@evidence settings/35-objects.md#rope-coil The loose coil has a floor role without load, binding tension, or carrying demonstrations.
@evidence settings/35-objects.md#jar-stand One narrow-post/circular-top object supports one jar, distinct from two-well timber rack.
@evidence materials/00-surface-palette.md#timber Rack/chest timber remains behind red-brown ceramics, without timber grain on the stone stand.
@evidence materials/00-surface-palette.md#stone Three northeast stand parts use light limestone, distinguishing 0.60m foot/narrow post without recoloring jar bodies.
@evidence materials/00-surface-palette.md#ceramic Four jar bodies/handles share terracotta; size/support differences remain geometry rather than color substitutions.
@evidence materials/00-surface-palette.md#wicker Basket wall/rim/floor dry fibre differs from ceramics; omitted vertical strands are not claimed implemented by texture.
@evidence materials/00-surface-palette.md#textile Only standard lid cloth receives 0.25m linen weave, not the whole chest.
@evidence materials/00-surface-palette.md#rope-fibre Floor rope/tie retain dry fibre without close-view strand twist or mechanical requirements.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Compared wells 0.268m, ring 0.34m, largest foot 0.60m, four vessels/chest with wall/delivery reservations. The former rack source erased authored wells; source restored them without changing the correct portable parent.
-->

North two-place rack stands at (7.4,−1.65)m with jar centers X=7.11/7.69m. Fit both bottoms to actual well floor Y=0.268m. Northeast stand (9.35,−1.6)m supports one large jar at ring top 0.34m. Other jars, basket, and chest occupy east/south walls, clearing delivery from door to (7.8,−0.3)m. Folded cloth meets chest lid rather than airborne covers on jar mouths. Threshold, support-top, east-wall close-up, and chest-front views examine every vessel contact and central clear path.

| role | model ID | X/Z, yaw, and support inputs |
| --- | --- | --- |
| `storage.rack` | `portable.jar-rack` | `7.4,-1.65` |
| `storage.rack-jar.west` | `ware.storage-jar` | `7.11,-1.65,0,atop("storage.rack","well")` |
| `storage.rack-jar.east` | `ware.carry-jar` | `7.69,-1.65,0,atop("storage.rack","well")` |
| `storage.stand` | `ritual.jar-stand` | `9.35,-1.6` |
| `storage.stand-jar` | `ware.storage-jar` | `9.35,-1.6,0,atop("storage.stand","ring")` |
| `storage.jar` | `ware.storage-jar` | `9.35,-0.8` |
| `storage.chest` | `fixture.chest` | `9.3,1.1` |
| `storage.cloth` | `portable.textile.standard` | `9.3,1.1,0,atop("storage.chest","lid")` |
| `storage.basket` | `ware.basket` | `9.4,0.3` |
| `storage.rope` | `portable.rope-coil` | `8.7,1.2` |

## Stationary carrying equipment in the northeast {#yard}

<!--
@evidence principles/core/common.md#declared-basis Consumes northeast yard reservations/two direct doors to choose X=8~9.5m, Z=-9.2~-7.1m, retaining portable stationary limits.
@evidence principles/core/common.md#scope-preservation Places cart, yoke, jar, basket, bucket, and separate coil northeast while clearing exterior delivery/direct colonnade access.
@evidence principles/core/common.md#substantive-completion Specifies cart (9,-8.1)m/yoke (8.4,-7.1)m and actual center-origin minY grounding rather than postponing height.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds six independent positions and continuous southwest delivery so the cart need not pass through doors.
@evidence principles/design/instances.md#instance-prototype-boundary Uses unchanged stationary cart/yoke without rotating wheel/hook rigs or scaled door-passage variants.
@evidence principles/design/instances.md#instance-derivation-authority Corrects center-origin yoke hook minimum -0.145m with the common minY formula, not a separate beam-center floor exception.
@evidence principles/design/instances.md#instance-verification-address Two thresholds test delivery, northeast close-up object overlap, and top view longest cart occupation against paths.
@evidence obligations/design/instances.md#addressable-instance-decisions Six yard roles remain separate from storage rack support chains/courtyard waiting objects.
@evidence obligations/design/instances.md#instance-prototype-membership yard.cart/yoke/jar/basket/bucket/rope each selects one formal prototype without implicit cart cargo or extra hook vessels.
@evidence obligations/design/instances.md#instance-identity-transform Six roles use yaw=0/unit scale/world coordinates under temple.root; cart/yoke center origins share minY correction.
@evidence obligations/design/instances.md#instance-variation-tiers One empty stationary cart state and existing storage jar never swap to cargo/load/rotation tiers for close cameras.
@evidence obligations/design/instances.md#instance-placement-review Checks wheel/hook ground contacts and full 0.8m delivery from exterior door through X=7.8m, rather than only one door passing.
@evidence settings/30-interiors.md#service-yard Open northeast yard objects remain accessible through two actual doors without a separate ring courtyard/hidden workshop.
@evidence spaces/rooms/service-yard.md#yard-volume Consumes low walls/paving/two doors unchanged, separating northeast objects from southwest delivery.
@evidence spaces/storey.md#ground-storey Yard objects contact paving Y=0 rather than courtyard -0.12m merely because outdoors.
@evidence materials/10-model-bindings.md#binding-map Yoke beam uses dark-wood/hooks dark-metal; cart deck/handle/support/axle/wheel preserve parent timber binding.
@evidence models/wares.md#storage-jar Large jar at (8,-9.2)m grounds its body independently without rack/stand.
@evidence models/wares.md#basket Open basket (8.55,-9.2)m occupies its own region right of jar, not hidden cart cargo.
@evidence models/portable.md#handcart Grounds cart by actual wheel minimum and tests full handles, not burying wheels by matching only deck origin.
@evidence models/portable.md#carrying-yoke Center-origin yoke at (8.4,-7.1)m remains laid down with empty hook holes and no carrying action.
@evidence models/portable.md#bucket Empty wide-mouth/high-handle bucket at (9.5,-7.1)m remains distinct from narrow-neck jars.
@evidence models/portable.md#rope-coil One loose three-loop coil at (8.2,-7.65)m adds no actual hook/handle bindings.
@evidence settings/35-objects.md#vessels Large yard jar belongs to empty carrying equipment, not indoor offering bowls or fountain water.
@evidence settings/35-objects.md#baskets One north basket retains broad low mouth beside jar, without path repetition.
@evidence settings/35-objects.md#handcart One empty stationary cart north of delivery door demonstrates neither rolling nor door-passage performance.
@evidence settings/35-objects.md#carrying-yoke Laid-down beam/two metal rings are independent equipment without load or restored ancient carrying methods.
@evidence settings/35-objects.md#bucket Northeast bucket is empty ceramic with high handle, without water weight/flow/carrying action.
@evidence settings/35-objects.md#rope-coil Loose yard coil remains equipment, not a physical jar-carrying tension system.
@evidence materials/00-surface-palette.md#timber Cart boards/axles/wheels and yoke beam retain timber; cylindrical cross-grain remains the existing prop-proxy limitation.
@evidence materials/00-surface-palette.md#metal Only two yoke hooks show bronze-like response; timber wheels do not become metal for convenience.
@evidence materials/00-surface-palette.md#ceramic Jar/bucket share red-brown ceramic while narrow-neck/wide-mouth differences remain prototype geometry.
@evidence materials/00-surface-palette.md#wicker Basket yellow-brown fibre differs from ceramics without new microscopic weave bitmaps for close views.
@evidence materials/00-surface-palette.md#rope-fibre Three loops/binding retain dry fibre distinct from paving without filling empty centers by material.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Compared long cart handles, lowest yoke hooks, six object envelopes, two doors, and 0.8m delivery with northeast reservations. Common minY establishes laid-down contact without widening prototypes/yard/stationary scope.
-->

Cart, yoke, one jar, one basket, bucket, and coil occupy northeast X=8~9.5m/Z=−9.2~−7.1m. Yoke origin is beam center; derive translationY to ground lowest hooks Y=−0.145m. Ground cart by actual wheel minY without rolling/door-passage claims. The 0.8m delivery exterior door→(7.8,−6.4)→(7.8,−3.15)→colonnade door→colonnade→storage remains south/west of objects. Both thresholds, northeast close-up, and top views inspect six-object nonoverlap, fixed state, and ground contact.

| role | model ID | X/Z, yaw, and support inputs |
| --- | --- | --- |
| `yard.cart` | `portable.handcart` | `9,-8.1` |
| `yard.yoke` | `portable.carrying-yoke` | `8.4,-7.1` |
| `yard.jar` | `ware.storage-jar` | `8,-9.2` |
| `yard.basket` | `ware.basket` | `8.55,-9.2` |
| `yard.bucket` | `portable.bucket` | `9.5,-7.1` |
| `yard.rope` | `portable.rope-coil` | `8.2,-7.65` |

## Waiting equipment outside the fountain center {#courtyard}

<!--
@evidence principles/core/common.md#declared-basis Uses permitted fountain-edge equipment and court center/colonnade clearance to choose X=±2.7m benches/planters; soil 0.27m comes from planter.
@evidence principles/core/common.md#scope-preservation Nine roles cover three benches, lamp, bucket, two planters/two plants without omitting/duplicating the existing center fountain.
@evidence principles/core/common.md#substantive-completion Prose fixes planter/plant side X, Z=2.2m, and soil hosts, so four nontable members are not arbitrary additions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds inward standard-bench rotations, northeast short bench, and planter/plant support chains to parent edge permission.
@evidence principles/design/instances.md#instance-prototype-boundary Bench.standard/short are named variants; plants use existing grass-tuft, not broad trees or new planter plants.
@evidence principles/design/instances.md#instance-derivation-authority West/east X=-2.7/+2.7m derives both planter/plant positions; roots derive only from each planter/soil without duplicate height lists.
@evidence principles/design/instances.md#instance-verification-address Planter close-ups test roots/soil, bench close-ups lamp/seat; four directions/corners test nine-object fountain/colonnade occlusion.
@evidence obligations/design/instances.md#addressable-instance-decisions Owns edge waiting objects independently of existing center fountain and site vegetation sets.
@evidence obligations/design/instances.md#instance-prototype-membership Five table roles plus planter.west/east and plant.west/east make nine; benches select two standard/one short exactly.
@evidence obligations/design/instances.md#instance-identity-transform Standard benches ±π/2 face center; short -π/2 faces west; side roles do not become traversal indices.
@evidence obligations/design/instances.md#instance-variation-tiers Only short bench differs by named dimensions; plants share geometry/material/scale=1 without close-view leaf-count LOD.
@evidence obligations/design/instances.md#instance-placement-review Compares longest benches/low planters with basin clearance/1.5m colonnade envelope, separately checking west-seat lamp contact.
@evidence settings/30-interiors.md#fountain Retains one low basin/jet, placing waiting benches, empty bucket, unlit lamp, and earth planters only at edges without blocking basin circulation.
@evidence spaces/rooms/courtyard.md#court-volume Benches/planters stay at stone courtyard edges with no central tree, preserving all directions/corners and colonnade walking reservations.
@evidence spaces/storey.md#ground-storey Courtyard bases use -0.12m; root world datum is -0.12+0.27=0.15m, not indoor Y=0.
@evidence materials/10-model-bindings.md#binding-map Planter pot terracotta, soil soil, blade foliage have separate addresses; only seat lamp is dark-metal, bench limestone.
@evidence models/portable.md#bench Uses two standard/one short seat/pier prototypes unchanged; west seat local top 0.46m supports the lamp.
@evidence models/portable.md#bucket Empty bucket beside west bench (-2.7,4)m contacts paving without fountain plumbing or filled water.
@evidence models/portable.md#portable-lamp Fits small lamp foot to west seat as low waiting equipment rather than a tall sanctuary lampstand.
@evidence models/portable.md#planter Two ceramic planters support roots on soil 0.27m, 0.09m beneath rims, both standing on finished paving.
@evidence models/landscape.md#grass-tuft Fits actual grass root minY to planter soil rather than copying landscape floor datum and floating roots.
@evidence settings/35-objects.md#bench Three low stone seats/two supports create edge waiting without backrests, sitting action, or measured traffic safety.
@evidence settings/35-objects.md#bucket One wide-mouth/high-handle ceramic west bucket stays empty without fountain flow/carrying-weight demonstration.
@evidence settings/35-objects.md#portable-lamp One low unlit seat lamp marks waiting equipment without supplementing daylight through emission.
@evidence settings/35-objects.md#planter Two low planters contain soil/separate plants without turning central stone courtyard into earth strips/tree zones.
@evidence materials/00-surface-palette.md#stone Three seat/pier prototypes share basin light limestone while retaining independent parts/water material.
@evidence materials/00-surface-palette.md#metal Only west lamp shows bronze-like dish response; bench seats remain stone.
@evidence materials/00-surface-palette.md#ceramic Two pots/empty bucket body/handle remain red-brown ceramic without ceramic spreading onto soil.
@evidence materials/00-surface-palette.md#earth Planter soil is a contained low brown surface, not soil material across courtyard paving.
@evidence materials/00-surface-palette.md#foliage Two grass-tuft blades retain gray-green distinct from pots/soil, without photographic leaves or new canopy assets.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Compared longest benches, two 0.42m planters/root contacts, basin/colonnade envelopes, and courtyard -0.12m. Existing prototypes/boundaries fit nine objects without changing basin scale, floor height, or vegetation species.
-->

On finished Y=−0.12m, standard benches at (±2.7,4.9)m face center; short bench stands at (2.7,−0.8)m. Separate west-bench bucket and seat lamp. Outside the table, court.planter.west/east use X=−2.7/+2.7m, Z=2.2m, yaw=0; court.plant.west/east use the same positions with roots at each soil maxY=0.27m. Add neither broad trees nor earth strips. Preserve the existing fountain and 1.5m colonnade walking envelope. Four directions, four corners, and bench/planter close-ups inspect all fixtures and actual paving contacts.

| role | model ID | X/Z, yaw, and support inputs |
| --- | --- | --- |
| `court.bench.west` | `portable.bench.standard` | `-2.7,4.9,Math.PI/2` |
| `court.bench.east` | `portable.bench.standard` | `2.7,4.9,-Math.PI/2` |
| `court.bench.short` | `portable.bench.short` | `2.7,-0.8,-Math.PI/2` |
| `court.lamp` | `portable.lamp` | `-2.7,5.25,0,atop("court.bench.west","seat")` |
| `court.bucket` | `portable.bucket` | `-2.7,4` |
