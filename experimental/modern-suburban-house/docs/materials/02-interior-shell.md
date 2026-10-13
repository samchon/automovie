# Interior shell finishes

## Warm light wall paint {#interior-wall-paint}
<!--
@evidence principles/core/common.md#declared-basis entry's light walls ground #F1EEE6/roughness 0.60 as authored response under the common color rule.
@evidence principles/core/common.md#scope-preservation Paint covers room-side walls outside tiled zones, including garage walls, without another wall or changed finish boundary.
@evidence principles/core/common.md#substantive-completion Color/linear values, coating response, host zones, 0.10 m grain, source, and threshold observation are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The verbal light-wall identity gains numeric response and complete-room face bindings.
@evidence principles/design/materials.md#material-construction-appearance Matte water-based paint over gypsum is construction; color/gloss approximates the coating without geometric film thickness.
@evidence principles/design/materials.md#material-binding-interface Room-owner metric wall UVs and actual openings/baseboards terminate the paint without rewriting host geometry.
@evidence principles/design/materials.md#material-verification-address Threshold views can falsify paint merged with casing or gray under warm ceiling light; neutral samples compare the swatch.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Entry/upper-hall wall identity and the complete room-face handoff suffice for paint response without geometry revision.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.10 m roller grain consumes room-owner UVs and ends at actual doors/windows/baseboards.
@evidence settings/10-house.md#entry Light entry walls receive the warm numeric coating without changing distribution geometry.
@evidence settings/10-house.md#powder Warm-white powder walls use the same paint outside its tile floor.
@evidence settings/10-house.md#upper-hall Light hall walls retain a warm separation from white trim.
@evidence spaces/03-surface-owners.md#interior-surface-handoff Each room's existing inner finish zones supply paint faces; tile-covered areas remain separate.
-->

The light walls of the [entry](../settings/10-house.md#entry), [upper hall](../settings/10-house.md#upper-hall), and bedrooms and warm-white [powder walls](../settings/10-house.md#powder) use matte water-based paint over gypsum board. Film thickness is not represented geometrically. Appearance approximates its color/gloss: `#F1EEE6` (linear 0.880, 0.855, 0.791), roughness 0.60, metallic 0.0, transmission 0.0. It is brighter than exterior siding `#EDE8DC` and warmer than [white interior trim](#interior-trim-white), allowing casing to separate from walls.

Bind all room-owner inner wall finish zones in the [complete interior handoff](../spaces/03-surface-owners.md#interior-surface-handoff), excluding [wall-tile zones](#bath-wall-tile) and including garage walls. Source owner is `src/materials/interior/walls.ts`. Threshold views under warm ceiling lights test whether walls remain light and distinct from casing.

Surface plan: micro roller grain repeats at 0.10 m using [room-wall UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff), ending at actual door/window/baseboard boundaries. Current source declares constant paint response without a color texture; grain realization and current close/review-distance GPU judgment remain unverified.

On the [chimney body](../spaces/envelope/left.md#chimney-roof-interface), the inside face X=-5.50 m within upper-storey Y=[3.06,5.66] m and Z=[-2.75,-1.65] m receives this bedroom wall paint. Exterior/above-roof shaft and ground-storey fireplace front retain brick. Existing triangles are partitioned at the finish boundary without a second wall or projecting paint plate.

## Flat white ceiling {#interior-ceiling}
<!--
@evidence principles/core/common.md#declared-basis visual-grammar grounds the authored #FAF9F6/roughness 0.65 under the common color convention.
@evidence principles/core/common.md#scope-preservation Finish covers existing room/garage ceilings and high stairwell ceiling without changing height or substrate.
@evidence principles/core/common.md#substantive-completion Color/linear values, coating constants, ceiling hosts, 0.10 m grain, source, and corner observation are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation White-ceiling identity gains numeric response and specific ceiling-face bindings.
@evidence principles/design/materials.md#material-construction-appearance Matte paint over gypsum is construction; optical values approximate the coating without emission.
@evidence principles/design/materials.md#material-binding-interface Existing ceiling UVs/cuts terminate at real holes/steps rather than a new ceiling plane.
@evidence principles/design/materials.md#material-verification-address Interior corners can falsify a lost wall/ceiling boundary or an apparently uniformly emissive ceiling.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work upper-ceiling-closure supplies complete room/stairwell faces and existing datums; this finish changes no substrate or hole.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.10 m weak roller grain uses ceiling-owner UVs and actual hole/step seams without substituting flat-color acceptance.
@evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The existing shared upper boundary supplies room and stairwell ceiling faces while structure remains its owner.
-->

All interior ceilings use matte white paint over gypsum board. Appearance is `#FAF9F6` (linear 0.956, 0.947, 0.922), roughness 0.65, metallic 0.0, transmission 0.0, approximating one coating layer. It is brighter/cooler than walls, intending to reveal their corner under the same light. Bind visible ceiling finishes of each room and the [high stairwell ceiling](../spaces/09-ceiling-assembly.md#upper-ceiling-closure); garage ceilings share the finish. Source owner is `src/materials/interior/ceilings.ts`. Corner views test wall/ceiling distinction and reject an apparently uniform emissive panel.

Surface plan: weak roller grain repeats at 0.10 m using [ceiling UVs/cuts](../spaces/09-ceiling-assembly.md#upper-ceiling-closure), ending at actual holes and height steps. It must remain readable under lights. Current source uses constant response without a texture; full grain and current close/review-distance GPU acceptance remain unverified.

## White interior trim and paneled leaves {#interior-trim-white}
<!--
@evidence models/13-bedrooms.md#sliding-closet carcass/leaf/shelf and real panel recesses receive white coating; rods/rails/handles/clothes remain separate finishes.
@evidence models/13-bedrooms.md#wardrobe-shelves Four shelves and two carcass sides receive coating, including actual ends/baseboard cuts; folded/shoe-box/basket faces remain separate.
@evidence models/03-interior-doors.md#interior-door-members Thick casing/jamb/leaf/panel members receive one coating using their actual metric UVs/end faces.
@evidence models/03-interior-doors.md#interior-door-surfaces A/B casing, jamb, leaf, and panel ids terminate coating before black handle/hinge faces.
@evidenceExclude models/03-interior-doors.md#interior-door-fidelity Omitted cores/screws/latches/closers have no material host; white coating does not recreate those mechanisms.
@evidence models/04-stair-members.md#stair-side-skirt Two sloped boards and the landing connector receive white stair-skirt coating using actual slope-length UVs without duplicating treads/risers.
@evidence models/05-closet-fittings.md#coat-closet-doors Existing two leaf depths and exterior casing receive paint while handles/rails remain metal.
@evidence models/05-closet-fittings.md#linen-closet-fittings Leaves/panels/five shelves/three casing boards receive coating including backs/cuts; distinct shelf/track origins remain intact.
@evidence models/05-closet-fittings.md#closet-fitting-surfaces leaf/panel/shelf/casing ids select coating, leaving rod/rail/handle with their metal owners.
@evidence models/06-interior-trim.md#wall-baseboard The closed 0.10 m-high/0.015 m-projecting baseboard receives run-aligned coating without changing miter geometry.
@evidence principles/core/common.md#declared-basis openings' white panel/casing identity grounds #F4F2EC/roughness 0.35 under the color convention.
@evidence principles/core/common.md#scope-preservation Finish covers listed window/door/storage/baseboard/skirt faces and spaces-owned risers/posts without changing geometry.
@evidence principles/core/common.md#substantive-completion Numeric response, exact face roles, closet distinctions, 0.10 m grain, source, and hall observation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation White openings/stair identity gains #F4F2EC and concrete leaf/jamb/casing/storage bindings.
@evidence principles/design/materials.md#material-construction-appearance Semi-gloss-painted timber/MDF construction remains separate from coating optics and geometry-owned panel divisions.
@evidence principles/design/materials.md#material-binding-interface Actual A/B jamb/casing roles, exterior-door casing, sill/casing, baseboard/skirt, and storage faces consume their own metric UVs.
@evidence principles/design/materials.md#material-verification-address Upper-hall views test separation from walls and narrower trim highlights rather than assuming a color constant passed.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Current opening/stair identities and listed closed prototype faces suffice for coating without creating a second wall-side closet body.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.10 m brush grain consumes space UVs for risers/posts and model UVs for leaves/casing/baseboards, ending at actual recesses/cuts.
@evidence settings/10-house.md#openings White interior casing/panel leaves remain separate from frames, glazing, and hardware.
@evidence settings/10-house.md#stair White risers/posts and separate skirts retain contrast with wood treads/handrails and black balusters.
-->

The [white interior casing/panel doors of 03–05](../settings/10-house.md#openings) and [white stair risers/posts](../settings/10-house.md#stair) use semi-gloss-painted timber/MDF. Models makes panel divisions. Appearance approximates the coating as `#F4F2EC` (linear 0.905, 0.888, 0.839), roughness 0.35, metallic 0.0, transmission 0.0.

Bind [interior door partitions](../models/03-interior-doors.md#interior-door-surfaces) `leaf`, `leaf-panel`, `jamb-a`, `jamb-b`, `jamb-core`, `casing-a`, `casing-b`; [front](../models/02-exterior-doors.md#front-entry-door)/[garden-door](../models/02-exterior-doors.md#garden-door-pair) `casing`; [baseboards](../models/06-interior-trim.md#wall-baseboard) `wall-baseboard`; [stair skirts](../models/04-stair-members.md#stair-side-skirt) `stair-skirt`; window `interior-sill`/`interior-casing` from [window partitions](../models/01-windows.md#window-surface-partitions); spaces-owned stair risers/posts; [coat](../models/05-closet-fittings.md#coat-closet-doors)/[linen](../models/05-closet-fittings.md#linen-closet-fittings) leaves/casing/shelves; [bedroom sliding closet](../models/13-bedrooms.md#sliding-closet) `casing`/`carcass`; and coat [rod/shelf prototype](../models/05-closet-fittings.md#coat-closet-rod-shelf) `shelf`. Source owner is `src/materials/interior/trim.ts`. View 05 tests white leaves/casing distinct from walls with narrower semi-gloss highlights.

Coat/linen closets are spaces-owned wall openings without a separate `carcass` mesh. Their `leaf`, `leaf-panel`, and `shelf` receive coating; metal rails/rods/handles do not. The `carcass` here is the [bedroom box closet](../models/13-bedrooms.md#sliding-closet), not a recreated coat/linen wall. Physical A/B jamb/casing boards belong to [interior-door members](../models/03-interior-doors.md#interior-door-members). [Inner window sill/casing](../models/01-windows.md#window-sill-trim) receives the same paint, including actual backs/ends.

Surface plan: brush grain repeats at 0.10 m. [Risers](../spaces/02-stair.md#stair-reservation) and [posts](../spaces/02-stair.md#stair-boundary-heights) consume space-owner axes/origins/seams; leaves/casing/baseboards consume their model UVs. Models determines recess/edge seams. Current source registers coating response without a texture; grain realization and close/review-distance GPU acceptance remain unverified.

## Oak flooring {#oak-floor}
<!--
@evidence principles/core/common.md#declared-basis entry's oak-colored floor grounds #B08050/roughness 0.50 as authored response under the color convention.
@evidence principles/core/common.md#scope-preservation Finish binds existing entry/living/common/service/pantry floors without changing geometry or heights.
@evidence principles/core/common.md#substantive-completion Color/linear values, coating response, 0.13 m plank module, room hosts, source, and threshold observations are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Oak identity gains numeric response and plank-grain binding beyond room geometry.
@evidence principles/design/materials.md#material-construction-appearance Oiled solid-wood planks remain construction; color/gloss/joint maps approximate their surface without another floor plate.
@evidence principles/design/materials.md#material-binding-interface Owner floor UVs preserve phase across rooms and break at actual material thresholds.
@evidence principles/design/materials.md#material-verification-address Views 04/03 test honey wood and correct powder/laundry threshold termination.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing entry/floor and corrected threshold interfaces suffice for grain response; earlier door ownership repair remains model work.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.13 m plank width and lengthwise oak grain consume floor-owner UVs with continuous phase and real threshold cuts.
@evidence settings/10-house.md#entry Oak-colored entry floor extends to the existing dry ground-storey rooms.
@evidence spaces/07-boundary-assembly.md#interior-boundary-junctions Finish changes follow existing threshold midplanes without changing door geometry.
@evidence settings/10-house.md#pantry Pantry's kitchen-continuous floor receives the same oak response.
@evidence spaces/10-ground-floor.md#main-ground-floor-base Existing level substrate supplies finished faces without a step introduced by finish choice.
-->

The [entry oak-colored flooring](../settings/10-house.md#entry) continues into ground-storey living/common/service/pantry areas. Construction is oiled solid-wood planks of width 0.13 m. Planned finish maps express plank joints and grain using the 0.13 m module and actual room/threshold boundaries; any later separate boards must agree with those boundaries. Appearance is `#B08050` (linear 0.434, 0.216, 0.080), roughness 0.50, metallic 0.0, transmission 0.0. Bind existing entry/living/common/service/pantry visible floors, changing materials at the [interior threshold interface](../spaces/07-boundary-assembly.md#interior-boundary-junctions). Source owner is `src/materials/interior/floors.ts`. Views 04/03 test honey-colored wood ending at powder/laundry thresholds.

Surface plan: plank width 0.13 m, deterministic lengthwise oak grain/joints in color/roughness maps, and [floor-owner UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff) preserve phase between rooms and stop at bathroom/laundry/material thresholds. Current source registers `oak.png` at 0.13×1.2 m; complete response and current close/review-distance GPU acceptance remain unverified.

## Light wooden stair treads {#stair-tread-wood}
<!--
@evidence principles/core/common.md#declared-basis stair's light-wood treads ground #B08050/roughness 0.50 under the shared color convention.
@evidence principles/core/common.md#scope-preservation Finish covers existing tread tops/nosings/landing without changing step dimensions or riser ownership.
@evidence principles/core/common.md#substantive-completion Shared oak response, tread hosts, 0.28 m run/0.13 m plank grain plan, source, and alternating-riser observation are stated.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The light-wood stair identity gains numeric response and host-face bindings beyond route geometry.
@evidence principles/design/materials.md#material-construction-appearance Thick oak tread construction remains host geometry; optical response approximates oiled wood.
@evidence principles/design/materials.md#material-binding-interface Tread/landing UVs come from the stair owner, breaking at nosings/landing junctions.
@evidence principles/design/materials.md#material-verification-address Sections/view 04 test alternating white risers and wood treads without inferring geometry success from color.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The existing stair identity and tread/landing metric interfaces suffice for wood response without changing route/count.
@evidence contracts/texture-readability.md#material-texture-readability Planned oak grain follows the 0.28 m run and 0.13 m plank width using tread-owner coordinates/cuts.
@evidence settings/10-house.md#stair Light wood remains continuous with the entry floor, distinct from white risers/posts.
@evidence spaces/02-stair.md#stair-reservation Existing tread tops/nosings/landing receive the finish while route and dimensions remain spatial.
-->

The [light wooden treads](../settings/10-house.md#stair) are thick oak of the same species as [oak flooring](#oak-floor). Appearance shares `#B08050` (linear 0.434, 0.216, 0.080), roughness 0.50, metallic 0.0, transmission 0.0. The stair rises from the entry wood floor in reference 04's relation, with no separate species/color basis. Bind the [single L-stair](../spaces/02-stair.md#stair-reservation) tread tops, front nosings, and intermediate landing floor. Risers receive [white trim](#interior-trim-white). Source owner is `src/materials/interior/stair.ts`; stair sections/view 04 test alternating white risers/wood treads.

Surface plan: grain follows each 0.28 m run with 0.13 m oak plank width, consuming [stair-owner UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff) and ending at nosings/landing joints separately from handrail grain. Current source registers `oak.png`; complete response and current close/review-distance GPU acceptance remain unverified.

## Wooden handrails {#handrail-wood}
<!--
@evidence principles/core/common.md#declared-basis stair's wooden handrail grounds the authored #8A5A34/roughness 0.45 under the color convention.
@evidence principles/core/common.md#scope-preservation Finish covers existing stair/stair-hole handrails without changing profiles, heights, or protective geometry.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, optics, host interfaces, 0.15 m grain, source, and continuity views are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The handrail identity gains numeric dark-wood response and concrete protective-boundary bindings.
@evidence principles/design/materials.md#material-construction-appearance Oiled hardwood round members remain construction; coating/grain optics approximate their appearance.
@evidence principles/design/materials.md#material-binding-interface Segment-owner metric UVs follow actual axes and break at post/wall contacts rather than a new continuous texture body.
@evidence principles/design/materials.md#material-verification-address Views 04/05 test a continuous recognizable handrail finish above white posts and black balusters.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing stair/hall identities and protective-boundary axes/contacts suffice for handrail response without another railing.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.15 m oak grain follows sloped segments and ends at actual post contacts.
@evidence settings/10-house.md#stair Darker wooden rails contrast with light treads, white posts, and black balusters.
@evidence settings/10-house.md#upper-hall The same wood finish continues along existing stair-hole protection without a new hall boundary.
@evidence spaces/02-stair.md#stair-boundary-heights Existing handrail heights/segment contacts provide finish hosts unchanged by response.
-->

The [stair wooden rail](../settings/10-house.md#stair) and [upper-hall handrail](../settings/10-house.md#upper-hall) use oiled hardwood with a round profile. Appearance is `#8A5A34` (linear 0.254, 0.102, 0.034), roughness 0.45, metallic 0.0, transmission 0.0. It is darker than treads and intended to read as a line over white posts/black balusters. Bind all existing stair and [stair-hole protective-boundary](../spaces/02-stair.md#stair-boundary-heights) handrail faces. Source owner is `src/materials/interior/stair.ts`; views 04/05 test continuous material identity.

Surface plan: 0.15 m-wide oak grain consumes [handrail-owner UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff), follows sloped segment directions, and breaks at post contacts. Current source declares constant response without a texture; grain/current close/review-distance GPU acceptance remains unverified.

## Black-coated metal {#black-coated-metal}
<!--
@evidence models/14-bathrooms.md#tub-curtain-rail Existing 1.80 m rail and two ceiling supports receive coating using actual circumference/length UVs, leaving curtain textile separate.
@evidence models/04-stair-members.md#stair-balusters Four sides/cut ends of actual 0.02 m square balusters receive coating without changed count/heights.
@evidence models/04-stair-members.md#stair-bottom-member The actual 3.52 m-long/0.04 m-section hall bottom-rail receives coating without new sloped flight rails.
@evidence models/04-stair-members.md#stair-member-surfaces baluster/bottom-rail ids remain distinct from white posts/risers and wooden handrails.
@evidenceExclude models/04-stair-members.md#stair-member-fidelity Omitted welds/bolts/baseplates have no coating host; powder grain proves neither those shapes nor protection/code performance.
@evidence principles/core/common.md#declared-basis stair's black steel and the linked hardware identities ground #1F1F20/roughness 0.40 under the authored-color convention.
@evidence principles/core/common.md#scope-preservation Finish covers listed guards/hardware/fixture bodies without changing their model geometry.
@evidence principles/core/common.md#substantive-completion Numeric coating response, concrete model/face roles, 0.05 m grain, source, and rail/curtain-rod views are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Black-rail identity gains #1F1F20 and scoped baluster/bottom-rail/handle/hinge bindings.
@evidence principles/design/materials.md#material-construction-appearance Powder-coated steel has dielectric coating metallic 0.0 rather than bare-steel appearance.
@evidence principles/design/materials.md#material-binding-interface Reused handle/rod/rail ids remain qualified by their model owner so stainless storage rails are not coated by name alone.
@evidence principles/design/materials.md#material-verification-address White-wall views can falsify merged balusters or invisible slim curtain rods.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing stair/shower hardware roles and model-qualified partitions suffice for coating without new hardware geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.05 m powder grain follows local member length U and resets at actual partition starts/junctions.
@evidence settings/10-house.md#porch-entry Dark entry handles remain separate from wood and glass.
@evidence settings/10-house.md#shower-bathroom Black shower handles retain contrast with glass/tile.
@evidence settings/10-house.md#stair Black balusters retain individual visibility between white posts and wooden rails.
-->

The [black vertical balusters](../settings/10-house.md#stair), [black shower handles](../settings/10-house.md#shower-bathroom), and [dark entry handles](../settings/10-house.md#porch-entry) are powder-coated steel. Appearance approximates coating: `#1F1F20` (linear 0.014, 0.014, 0.014), roughness 0.40, metallic 0.0, transmission 0.0 under the [response convention](00-material-frame.md#material-response-conventions).

Bind [balusters](../models/04-stair-members.md#stair-balusters) `baluster`, [bottom member](../models/04-stair-members.md#stair-bottom-member) `bottom-rail`, interior/front-door `handle`/`hinge`, shower handles, coated bathroom hardware, [eight-window curtains](../models/13-bedrooms.md#primary-window-curtains) `rod`/`bracket`, and [wall mirrors](../models/14-bathrooms.md#wall-mirror) `mirror-frame`. Model qualification is essential: towel-bar `rod`/`bracket` and shower/storage `rail` belong to [stainless steel](03-furnishings.md#stainless-steel); the [tub-curtain rail](../models/14-bathrooms.md#tub-curtain-rail) `rail`/support `rod` is black-coated. Source owner is `src/materials/interior/metal.ts`; views test individual balusters and slim rods against white walls.

Handles/recess faces of [base cabinets](../models/10-kitchen-dining.md#kitchen-base-run), [wall cabinets](../models/10-kitchen-dining.md#kitchen-wall-cabinet), [island](../models/10-kitchen-dining.md#kitchen-island), [vanity](../models/14-bathrooms.md#vanity-basin), [coat](../models/05-closet-fittings.md#coat-closet-doors)/[linen](../models/05-closet-fittings.md#linen-closet-fittings) closets, [bedroom closet](../models/13-bedrooms.md#sliding-closet), [dresser](../models/13-bedrooms.md#low-dresser), and [garage workbench](../models/12-service-rooms.md#garage-workbench) use this coating. Laundry-upper grooves retain `leaf` and [greige coating](03-furnishings.md#greige-cabinet). [Dishwasher handles](../models/10-kitchen-dining.md#kitchen-dishwasher) and [toilet flush levers](../models/14-bathrooms.md#shared-toilet) are stainless. Project each part's metric length U/perimeter V, breaking at its ends. These planned unbuilt-object assignments are not claims of active bindings.

[Interior-door hinges](../models/03-interior-doors.md#interior-door-hinges), [front-door hinges/handles](../models/02-exterior-doors.md#front-entry-door), [mudroom hooks](../models/12-service-rooms.md#mudroom-coat-hooks) `hook`, [pendants](../models/17-light-fixtures.md#pendant-fixtures) `fixture-canopy`/`fixture-stem`, [porch sconce](../models/17-light-fixtures.md#porch-wall-sconce) `fixture-housing`/`fixture-stem`, [flush lights](../models/17-light-fixtures.md#flush-ceiling-fixture), and [vanity lights](../models/17-light-fixtures.md#vanity-wall-fixture) `fixture-housing` receive this coating. Inspect each actual prototype face rather than assuming all identically named parts match.

Surface plan: 0.05 m micro powder grain follows local length U, starting anew per partition and ending at joints. Current source declares constant response without that texture; grain and current close/review-distance GPU judgment remain unverified.

## Beige carpet {#beige-carpet}
<!--
@evidence principles/core/common.md#declared-basis upper-hall's beige carpet grounds #CDBFA6/roughness 0.95 under the authored-color rule.
@evidence principles/core/common.md#scope-preservation Finish binds hall/primary/wardrobe/two small-room floors without changed floor datums or bathroom coverage.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, matte response, 0.01 m loop scale, room bindings, source, and threshold observation are stated.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Neutral carpet identity gains numeric response and room-floor assignment beyond spatial construction.
@evidence principles/design/materials.md#material-construction-appearance Short loop pile/underlay remain construction; color/normal grain approximates pile without another floor geometry.
@evidence principles/design/materials.md#material-binding-interface Floor-owner UVs retain same-storey phase and end at tile thresholds/stair edges.
@evidence principles/design/materials.md#material-verification-address View 05 tests light matte carpet and correct tile boundaries rather than presumed success from constants.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Hall/primary-room identity and the complete floor handoff suffice for carpet response without new thresholds or datums.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.01 m loop color/normal grain receives upper-floor coordinates and breaks at tile/threshold/stair cuts.
@evidence settings/10-house.md#bedroom-two The small bedroom continues the primary room's neutral carpet family.
@evidence settings/10-house.md#primary-bedroom Neutral primary floor remains distinct from wood/bedding.
@evidence settings/10-house.md#shower-bathroom Carpet ends at the bathroom threshold rather than extending into the wet room.
@evidence settings/10-house.md#upper-hall Hall carpet shares the existing upper private-zone material system.
@evidence spaces/rooms/shower-bath.md#shower-bath-plan Its explicit threshold terminates carpet at the bathroom boundary.
@evidence spaces/08-floor-assembly.md#interstorey-floor-boundary Carpet response preserves the same finished datum despite tile/underlay differences.
@evidence spaces/04-observations.md#reference-spatial-comparisons The 05 comparison can contrast neutral carpet and bathroom tile within the same house.
-->

The [upper-hall beige carpet](../settings/10-house.md#upper-hall), [primary carpet](../settings/10-house.md#primary-bedroom), and [two smaller rooms](../settings/10-house.md#bedroom-two) share one neutral finish because the small rooms continue the primary material system. Construction is short-loop carpet with underlay; the planned 0.01 m color/normal repeat approximates pile. Appearance is `#CDBFA6` (linear 0.610, 0.521, 0.381), roughness 0.95, metallic 0.0, transmission 0.0. Bind hall/primary/wardrobe/bedroom-two/bedroom-three visible floors, [ending at bathroom thresholds](../settings/10-house.md#shower-bathroom). Source owner is `src/materials/interior/floors.ts`; view 05 tests light matte carpet and aligned tile transitions.

Surface plan: 0.01 m short-loop color/normal grain consumes [upper-floor UVs/cuts](../spaces/08-floor-assembly.md#interstorey-floor-boundary), ending at tile/threshold/stair edges. Current `carpet.png` is registered as color; normal response and current close/review-distance GPU judgment remain unverified.

## Bathroom floor tile {#bath-floor-tile}
<!--
@evidence principles/core/common.md#declared-basis powder's light tile floor grounds #D8D4CC/roughness 0.40 under the authored-color convention.
@evidence principles/core/common.md#scope-preservation Finish binds powder/shower/tub floors without changing their geometry or introducing grout meshes.
@evidence principles/core/common.md#substantive-completion Tile/linear color, optics, 0.30 m module/0.005 m joint plan, room hosts, source, and wall/floor observation are stated.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Light-tile identity gains numeric glaze response and metric tile/grout binding.
@evidence principles/design/materials.md#material-construction-appearance Glazed porcelain construction is distinguished from averaged glaze color/gloss and planned grout masks.
@evidence principles/design/materials.md#material-binding-interface Existing floor-owner UVs receive the 0.30×0.30 m module, ending at drains/walls/thresholds.
@evidence principles/design/materials.md#material-verification-address Bathroom thresholds can falsify merged floor/wall tile or incorrect joint scale.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Powder's tile identity and complete floor-owner interfaces suffice without changing wet-room floor geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned square tile/joints retain physical size and actual floor cuts rather than painted arbitrary boundaries.
@evidence settings/10-house.md#powder Light tile supplies the powder floor identity separately from warm-white walls.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use The existing tub-room floor receives tile and carpet ends at its threshold without changing fixture routes.
-->

The [light powder tile floor](../settings/10-house.md#powder) and bathroom wet floors use glazed porcelain tile at a 0.30 m module. [Grout](#tile-grout) is a 0.005 m UV mask with planned normal shading on the same floor, without separate recessed geometry or `grout` face id. Appearance approximates glaze as `#D8D4CC` (linear 0.687, 0.658, 0.604), roughness 0.40, metallic 0.0, transmission 0.0. It is darker than wall tile so their corner can read. Bind powder/shower-bath/tub-bath visible floors. Source owner is `src/materials/interior/tile.ts`; threshold views compare floor and wall tile.

Surface plan: 0.30×0.30 m plates/joints consume [room-floor UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff), ending at drains, walls, and thresholds. Current `tile.png` provides a color pattern; complete grout response and current close/review-distance GPU judgment remain unverified.

## Bathroom wall tile {#bath-wall-tile}
<!--
@evidence principles/core/common.md#declared-basis shower-bathroom's white tile and kitchen-equipment's backsplash ground #EEEDEA/roughness 0.30 as authored response.
@evidence principles/core/common.md#scope-preservation Finish covers existing shower/tub walls and backsplash zones without another tile/grout geometry.
@evidence principles/core/common.md#substantive-completion Numeric glaze response, 0.30×0.10 m plan, exact wet-zone coordinates, source, and wall-paint comparison are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation White-tile identity gains numeric response and independently bounded wet-wall/backsplash bindings.
@evidence principles/design/materials.md#material-construction-appearance Glazed ceramic construction is separate from optical constants and internal texture joints.
@evidence principles/design/materials.md#material-binding-interface Host walls retain coordinates/UVs; tile zones end at actual fixtures/cabinet edges/niche cuts.
@evidence principles/design/materials.md#material-verification-address Views 05/03 can falsify wall tile merged with paint despite distinct constants.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing shower/kitchen identities and room-owned wall interfaces suffice for finish-zone assignment without changed room geometry.
@evidence contracts/texture-readability.md#material-texture-readability The planned staggered 0.30 m-wide/0.10 m-high rows consume wall-owner metric UVs and real corner/niche/fixture cuts.
@evidence settings/10-house.md#kitchen-equipment Tile backsplash retains the kitchen's separate wall finish between cabinets.
@evidence settings/10-house.md#shower-bathroom White wet-wall tile remains distinct from ceramic fixtures and glass.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use Wall-tile roughness 0.30 versus enamel 0.25 supplies a planned response distinction without claiming GPU success.
-->

This is [white bathroom tile](../settings/10-house.md#shower-bathroom) and the [kitchen backsplash](../settings/10-house.md#kitchen-equipment), constructed as glazed ceramic. The 0.30×0.10 m module and [grout](#tile-grout) are responses in existing wall UVs, without separate tile/joint geometry. Appearance is `#EEEDEA` (linear 0.855, 0.847, 0.823), roughness 0.30, metallic 0.0, transmission 0.0. Bind shower-booth inner walls, tub surrounds, and wall zones between kitchen lower/upper cabinets, bounded by existing fixture/cabinet ends. Source owner is `src/materials/interior/tile.ts`; views 05/03 test gloss distinction from paint.

Surface plan: staggered horizontal 0.30 m × vertical 0.10 m rows and weak glaze roughness consume [room-wall UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff), ending at corners, doors, niches, and fixtures. Current `wall-tile.png` is a color map with an aligned grid, not realization of the staggered-row/roughness/normal plan. Complete response and current close/review-distance GPU judgment remain unverified.

Tile zones are the shower's primary-bedroom-side wall X=[0.82,0.90], Z=[-8.80,-7.70] m and rear wall Z=-8.80, X=[0.90,2.15] m; the tub's right wall X=5.50, Z=[-8.70,-6.90] m and rear wall Z=-8.80, X=[4.70,5.50] m. Both bathrooms use Y=[3.06,5.66] m, and shower niche interiors share tile. Backsplash zones face the room at X=-5.50, Z=[-9.80,-7.40] m and Z=-10.45, X=[-5.50,-2.15] m, Y=[0.91,1.45] m. `src/materials/wall-tile-partitions.ts` partitions existing triangles at these boundaries, interpolating positions/normals/UVs rather than adding wall bodies; total-area preservation remains a requirement, not a newly measured result here.

## Tile grout {#tile-grout}
<!--
@evidence principles/core/common.md#declared-basis The shared palette grounds #A9A39A/roughness 0.90 as an authored cement-grout response.
@evidence principles/core/common.md#scope-preservation Grout is a 0.005 m UV/normal mask within existing tile faces without independent geometry or face ids.
@evidence principles/core/common.md#substantive-completion Color/linear values, response, Euclidean-modulo equations, staggered wall offset, normal slope, and observations are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The tile palette gains numeric grout response and deterministic metric joint equations.
@evidence principles/design/materials.md#material-construction-appearance Cement joints remain construction; color/normal masks approximate recesses without displacement.
@evidence principles/design/materials.md#material-binding-interface floor/wall tile shares existing UV masks and origins with its grout response, requiring no grout host id.
@evidence principles/design/materials.md#material-verification-address Close/review views test the 0.005 m joint against each tile module and reject displaced silhouettes.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The palette and existing floor/wall metric coordinates suffice for internal grout masks without new tile or room geometry.
@evidence contracts/texture-readability.md#material-texture-readability The floor 0.30×0.30/wall 0.30×0.10 m masks share origins/rotation and terminate at actual face edges without tinting tile centers.
-->

This H2 owns the cement-grout response shared by floor/wall tile. Appearance is `#A9A39A` (linear 0.397, 0.366, 0.323), roughness 0.90, metallic 0.0, transmission 0.0. There is no independent grout geometry or `grout` face id. Within the existing tile face UVs, distinguish tile centers and joint masks; planned normal response changes light direction only, not silhouette/depth. Source owner is `src/materials/interior/tile.ts`. Close views test module/0.005 m alignment and review-distance color/normal readability.

Set `modE(x,m)=x−m floor(x/m)` for consistent negative coordinates. On floor UVs, `dU=min(modE(U,0.30),0.30−modE(U,0.30))` and `dV=min(modE(V,0.30),0.30−modE(V,0.30))` m. `dU<0.0025` or `dV<0.0025` denotes a combined-width 0.005 m joint across the boundary. On walls, set `r=floor(V/0.10)` and `U′=U+0.15×modE(r,2)`, staggering rows by 0.15 m; substitute U′ for U in dU and 0.10 for the dV module 0.30. Across each 0.0025 m half, a linear normal slope approximates a 0.002 m recessed center without mesh displacement. [Room-face owners](../spaces/03-surface-owners.md#interior-surface-handoff) supply each tile's UVs/cuts. Current generators provide color-joint patterns but not this normal response or the staggered wall-row realization; complete response/current close/review-distance GPU judgment remains unverified.

## Light-gray laundry floor {#laundry-floor}
<!--
@evidence principles/core/common.md#declared-basis laundry-mudroom's light durable floor grounds #C9C4BA/roughness 0.50 under the common color rule.
@evidence principles/core/common.md#scope-preservation Finish covers existing laundry floor/high-threshold riser without changed datum or another step.
@evidence principles/core/common.md#substantive-completion Color/linear values, optics, 0.30 m square grain plan, source, and concrete comparison are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Laundry-floor identity gains numeric vinyl response and actual floor/riser bindings.
@evidence principles/design/materials.md#material-construction-appearance Vinyl planks remain construction; color/gloss/grain approximate their surface rather than another floor geometry.
@evidence principles/design/materials.md#material-binding-interface Existing floor UVs retain projection and end at mudroom/garage threshold boundaries.
@evidence principles/design/materials.md#material-verification-address Mudroom-door views can falsify lost brightness/gloss distinction from garage concrete.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The laundry identity and existing floor/step faces suffice for finish response without new threshold construction.
@evidence contracts/texture-readability.md#material-texture-readability Planned weak mottling/roughness uses a 0.30 m square module and actual floor-owner seams.
@evidence settings/10-house.md#laundry-mudroom Durable light-gray floor remains brighter/smoother than the adjacent garage concrete.
-->

The [light-gray durable laundry floor](../settings/10-house.md#laundry-mudroom) is vinyl plank construction. Appearance is `#C9C4BA` (linear 0.584, 0.552, 0.491), roughness 0.50, metallic 0.0, transmission 0.0, brighter/smoother than [garage concrete](#garage-concrete). Bind existing laundry visible floor and high mudroom-threshold riser. Source owner is `src/materials/interior/floors.ts`; mudroom-door views test brightness/gloss distinction at the shared threshold.

Surface plan: weak mottling/roughness repeats in a 0.30 m square module using [floor-owner UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff), breaking at mudroom/garage thresholds. Current source declares constant response without a texture; grain/current close/review-distance GPU judgment remains unverified.

## Garage concrete {#garage-concrete}
<!--
@evidence principles/core/common.md#declared-basis garage's concrete interior grounds #9C9890/roughness 0.85 under the common authored-color rule.
@evidence principles/core/common.md#scope-preservation Finish covers the existing garage top; walls retain paint without another gray variant or changed geometry.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, optics, 0.50 m grain, garage host, source, and corner observation are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Concrete-floor identity gains numeric response and its distinct interior-floor binding.
@evidence principles/design/materials.md#material-construction-appearance Troweled slab construction remains geometry; color/roughness/grain approximates its exposed surface.
@evidence principles/design/materials.md#material-binding-interface Existing garage-floor UVs and door/threshold/paving boundaries delimit the grain without another floor.
@evidence principles/design/materials.md#material-verification-address Corner views can falsify garage concrete indistinguishable from lighter paving or smoother laundry flooring.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The garage identity and garage-interior-plan supply the existing exposed top without revising room geometry or support.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.50 m aggregate/mottling consumes floor-owner UVs and cuts at actual rail/threshold/paving interfaces.
@evidence settings/10-house.md#garage Empty-garage concrete retains its separate darker finish without vehicles.
@evidence spaces/rooms/garage-interior.md#garage-interior-plan The exposed top remains the garage-room finish; its substrate and high mudroom step keep their owners.
-->

The [garage concrete floor](../settings/10-house.md#garage) is troweled slab construction. Appearance is `#9C9890` (linear 0.332, 0.314, 0.279), roughness 0.85, metallic 0.0, transmission 0.0. Garage gypsum walls receive [interior paint](#interior-wall-paint) without another gray response. Bind [garage-interior](../spaces/rooms/garage-interior.md#garage-interior-plan)'s exposed concrete top. Source owner is `src/materials/interior/floors.ts`; corner views test darker/rougher response than site concrete.

Surface plan: 0.50 m fine aggregate/slow mottling consumes [room-floor UVs/cuts](../spaces/03-surface-owners.md#interior-surface-handoff), ending at actual door-rail, mudroom-threshold, and paving boundaries. Current `garage.png` is registered; complete response/current close/review-distance GPU judgment remains unverified.
