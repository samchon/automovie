# Stair balusters and bottom members

## Baluster section and repetition {#stair-balusters}
<!--
@evidence principles/core/common.md#scope-preservation Owns 0.02 m square baluster sections, placement centered in the 0.075 m reservation and count/gap derivation, leaving posts/handrails with spaces source.
@evidence principles/core/common.md#substantive-completion Lower-flight, landing and flat-corridor sections use L between post interiors and repeat n=ceil((L−0.10)/0.12), gap=(L−0.02n)/(n+1). Upper flight has four balusters centered at X=a_j+0.05+0.06k(k=0…3) on each tread j=1…8, cut at wall start Y=2.75 m.
@evidence principles/core/common.md#declared-basis Receives gap limits/roles from spaces/02-stair.md#stair-boundary-heights, occupancy reservation from #stair-clearance and vertical steel balusters from settings/10-house.md#stair.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Realizes 02-stair's baluster-gap limit/subsequent repetition handoff as lower-flight/landing/corridor count formulas and four balusters per upper-flight tread.
@evidence principles/design/models.md#representation-contract Defines rigid baluster prototypes and top/bottom connections.
@evidence principles/design/models.md#spatial-convention Identifies the origin as the baluster-bottom center.
@evidence principles/design/models.md#reviewable-structure Falsifies gaps in 02's flight, intermediate-landing and upper-arrival views.
@evidence principles/design/models.md#model-observable-style-basis Adopts regularly spaced black balusters from reference 03·04 stairs as 0.02 m square vertical steel sections.
@evidence principles/design/models.md#model-scale-layer-completion Defines occupancy scale within reserved width.
@evidence spaces/02-stair.md#stair-boundary-heights Consumes baluster clear-gap maximum 0.10 m through count/gap formulas.
@evidence spaces/02-stair.md#stair-clearance Places 0.02 m balusters on the centerline of each side's 0.075 m occupancy reservation.
@evidence settings/10-house.md#stair Consumes black vertical steel balusters as 0.02 m square sections.
@evidence contracts/reservation-fit.md#reservation-fit Arithmetic shows baluster occupancy 0.02 m within reservation 0.075 m and gaps at most 0.10 m.
@evidence obligations/design/models.md#articulation-ownership Defines balusters as rigid members without articulation.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Receives 02-stair's upper-handrail height 0.90 m above nosings and wall start Y=2.75 m to limit upper-flight baluster tops without changing parent handrail/wall boundaries.
-->

Adopt regularly spaced black balusters from reference 03·04 stairs. Counts derive from flight lengths rather than photographs.

The [stair-boundary-height owner](../spaces/02-stair.md#stair-boundary-heights) leaves models the members/repetition of black vertical steel balusters filling between posts/handrails. Spaces source already makes posts/handrails within [both 0.075 m reservations](../spaces/02-stair.md#stair-clearance), so this model does not recreate them. For the thin vertical steel balusters in [single turning-stair settings](../settings/10-house.md#stair), choose square sections of side 0.02 m, centered in the 0.075 m reservation so passage-side occupancy stays within its boundary. Lower flight, landing and flat upper-corridor sections use L between end-post inner faces, count n=ceil((L−0.10)/0.12) and clear gap (L−0.02n)/(n+1)≤0.10 m. The upper flight assumes no arrival post and places four balusters separately per tread width 0.28 m. Its [upper handrail](../../src/spaces/stair-guards.ts) extends from first nosing X=−0.65 m/top Y=2.43 m to arrival nosing X=1.87 m/top Y=3.96 m; balusters stop at the lower of handrail underside and wall-start Y=2.75 m. The ninth tread top Y=2.89 m already exceeds wall start, so no balusters are placed there.

Local origin is baluster-bottom center, local +Y equals world +Y, and all balusters are rigid without articulation interfaces. Lower flight/landing tops abut handrail undersides and bottoms abut visible tread/landing tops. Upper-flight tops abut the lower of handrail underside/Y=2.75 m, with bottoms on each tread top. Upper-corridor balusters stand from [bottom-member](#stair-bottom-member) top to handrail underside. The source owner is `src/models/stair-baluster.ts`; inspection addresses are 02's entry-visible lower flight, both landing directions, wall-height sections at tread nosings/upper arrival, and corridor edge.

For flat sections, each `baluster` center along length axis s from the post interior is s=gap+0.01+i×(0.02+gap) m for i=0…n−1, with gap=(L−0.02n)/(n+1) m. Upper-flight treads j=1…8 receive [structural-tread](../../src/spaces/stair.ts) start a_j=−0.65+0.28(j−1) m and top h_j=1.36+0.17j m. Four `baluster` centers per tread are X=a_j+0.05+0.06k m for k=0…3, with section X=[center−0.01,center+0.01]·Z=[−3.4575,−3.4375] m. Inner-end gaps on each tread are 0.04 m and clear gaps between adjacent treads 0.08 m, within the 0.10 m ceiling. The first j's left end also lies 0.04 m from landing post X=−0.65 m; no 0.02 m section crosses a_j or next-riser line a_j+0.28 m. Bottom Y=h_j, top Y=min(2.75, 2.43+(X+0.65)×1.53/2.52−0.075) m. At j=8, h_j=2.72<2.75 m; at j=9, h_j=2.89>2.75 m, so positive-height balusters are made only through j=8. Four side faces and both cut ends belong to each square-column member without entering closed volumes of spaces treads, posts, handrails or wall Y≥2.75 m.

## Bottom members at treads and corridor edge {#stair-bottom-member}
<!--
@evidence principles/core/common.md#scope-preservation Owns the decision to omit lower crossbars on flights/intermediate landing and place bottom-rail only along the corridor edge.
@evidence principles/core/common.md#substantive-completion Defines bottom-rail Y=[3.11,3.15] m/width 0.04 m between upper-corridor post interiors X=[−1.725,1.795] m at boundary center Z=−4.635 m, explaining the triangular gaps caused by sloped rails.
@evidence principles/core/common.md#declared-basis Receives the lower empty-height ceiling 0.10 m from spaces/02-stair.md#stair-boundary-heights.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Realizes 02-stair's below-tread gap ceiling as direct tread support in sloped sections and `bottom-rail` Y=[3.11,3.15] m on the flat corridor.
@evidence principles/design/models.md#representation-contract Defines bottom-rail/baluster connections.
@evidence principles/design/models.md#spatial-convention States bottom-rail height relative to the upper-storey floor.
@evidence principles/design/models.md#reviewable-structure Falsifies empty height in per-tread side sections and corridor-edge sections.
@evidence principles/design/models.md#model-observable-style-basis Adopts reference 04's white lower stair band/black baluster junction and defines a black steel bottom member.
@evidence principles/design/models.md#model-scale-layer-completion Defines presence/absence of the bottom-member layer by segment.
@evidence spaces/02-stair.md#stair-boundary-heights Consumes the lower empty-height maximum 0.10 m through direct tread attachment and bottom-rail gap 0.05 m.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes 02 unchanged without parent revision.
-->

Adopt reference 04's white lower stair band/black baluster junction. Treads/posts are reviewed spaces members.

Sloped flights and the intermediate landing have no separate bottom crossbar; balusters stand directly on each tread/landing. A sloped bar could create riser-height triangular gaps behind treads, violating the [owner's lower empty-height ceiling 0.10 m](../spaces/02-stair.md#stair-boundary-heights). The flat upper-corridor fall boundary receives centerline Z=(−4.71−4.56)/2=−4.635 m from [two posts and the upper handrail](../../src/spaces/stair-guards.ts). Posts occupy X=[−1.80,−1.725]·[1.795,1.87] m, so one black `bottom-rail` closes between their inner faces at X=[−1.725,1.795], Z=[−4.655,−4.615], Y=[3.11,3.15] m. This height/width 0.04 m board has its underside 0.05 m above upper-storey floor Y=3.06 m, abutting posts at both end faces. Corridor balusters begin at Y=3.15 m and end at upper-handrail underside Y=4.035 m. Applying the [common count formula](#stair-balusters) to L=3.52 m gives n=29 and clear gap (3.52−29×0.02)/30=0.098 m, within the 0.10 m ceiling. The source owner is `src/models/stair-baluster.ts`; inspect per-tread side sections and corridor-edge sections.

## Sloped side skirts beside the open stair {#stair-side-skirt}
<!--
@evidence principles/core/common.md#scope-preservation Owns reference 03·05's white side skirts as two sloped boards beside the open outer faces of lower/upper flights and one landing-corner connector, without making tread bodies, guards or wall baseboards.
@evidence principles/core/common.md#substantive-completion Defines outer thickness 0.015 m for both flights, height 0.10 m above tread line, four trapezoid points derived from run 0.28 m/rise 0.17 m, and landing-corner connector 0.015 m.
@evidence principles/core/common.md#declared-basis Receives both flights' rise 0.17 m/run 0.28 m, directions and outer structural faces from spaces/02-stair.md#stair-reservation, and guard occupancy/upper-wall start from that document's #stair-clearance/#stair-boundary-heights.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds independent white sloped finish-board prototypes and end connections between closed stair structural sides and open-edge guards.
@evidence principles/design/models.md#representation-contract Owns front/back/top/bottom/end faces of three closed rigid members under one `stair-skirt` id without duplicating spaces tread sides.
@evidence principles/design/models.md#spatial-convention Takes actual outer flight sides as local depth 0 and puts thickness 0.015 m toward the open room; derives lower board to the landing-connector front and upper board to ground-floor ceiling Y=2.75 m, leaving upper boundaries with spaces.
@evidence principles/design/models.md#reviewable-structure Entry-visible lower flight, inner landing corner, upper-board ceiling termination and side orthographic sections falsify volume intersections with treads, guards, baseboards/upper boundaries and breaks in the white band.
@evidence principles/design/models.md#model-observable-style-basis Adopts reference 03·05's white sloped band beneath treads as closed boards like interior trim, without using photographic proportions for dimensions.
@evidence principles/design/models.md#model-scale-layer-completion Defines slope equations, thickness, corner connection, terminations, face id, metre UVs and subsequent source owner without creating new stair/room boundaries.
@evidence spaces/02-stair.md#stair-reservation Receives the single L-shaped stair's rise 0.17 m/run 0.28 m, lower 7 steps, landing and upper 9 steps as inputs for two sloped-board lengths/slopes.
@evidence spaces/02-stair.md#stair-clearance Separates guards using the inner stair passage reservation 0.075 m from side boards using 0.015 m roomward of structural sides, avoiding passage-reservation intersections.
@evidence spaces/02-stair.md#stair-boundary-heights Distinguishes open guards at upper-flight front from upper wall-mounted handrail sections and consumes the vertical opening rim's start above the lower-ceiling finish.
@evidence spaces/rooms/entry.md#entry-plan Terminates white upper side skirt at entry-ceiling finish underside Y=2.75 m without models recreating the ceiling slab or vertical stair rim above.
@evidence contracts/reservation-fit.md#reservation-fit Outer boards 0.015 m and existing inner guard reservation 0.075 m meet only across the stair side without overlap; actual roomward passage is remeasured in subsequent compiled observations.
@evidence obligations/design/models.md#addressable-model-decisions Gives white side skirts an address distinct from balusters/corridor bottom rails.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Finish boards occupy 0.015 m outside the unchanged structural tread sides/guard reservations, requiring no revised parent route or stair value. Existing skirt source follows those bands; that source correspondence does not establish complete room-side clear width or current GPU acceptance.
-->

Adopt reference 03·05's white sloped side skirts as separate closed boards attached outside stair structural sides rather than concealing them as painted tread sides. [Stair-plan](../spaces/02-stair.md#stair-reservation) spaces owns structural treads/landing; this document's first two prototypes and spaces handrails own black guards; this H2's single `src/models/stair-skirt.ts` owner owns white skirts. Room-wall [horizontal baseboards](06-interior-trim.md#wall-baseboard) end in front of the first riser without substituting for sloped boards.

The lower flight occupies only thickness 0.015 m toward entry +X from `src/spaces/stair.ts` open side X=−0.65 m. Its length axis runs −Z from start Z=−1.45 m to landing-connector front Z=−3.395 m; lower edge is `Y=0.17×(−1.45−Z)/0.28` m and upper edge that value+0.10 m. Four endpoints (Z,Y) are `(−1.45,0)`, `(−1.45,0.10)`, `(−3.395,1.280892857)`, `(−3.395,1.180892857)` m. The upper flight starts entryward at X=−0.635 m on open front side Z=[−3.41,−3.395] m. Its lower edge is `Y=1.36+0.17×(X+0.65)/0.28` m and upper edge that value+0.10 m. Starting heights are [1.369107143,1.469107143] m; vertically cut the board at `Xc=−0.65+(2.75−1.46)×0.28/0.17=1.474705882` m, where its top meets [entry-ceiling](../spaces/rooms/entry.md#entry-plan) finish underside Y=2.75 m. Cut-end heights are [2.65,2.75] m. Entry-ceiling finish Y=[2.75,2.765] m and `stair-opening-edge-front` beginning at its top remain spaces members, with this prototype entering neither volume. Upper-flight sides X>Xc remain spaces boundaries without extended side skirts. Final riser/upper floor Y=3.06 m are existing spaces members; side skirts do not extend to that floor. Neither sloped board enters the inner stair guard reservation 0.075 m. Compare entry-visible lower flight, inner landing corner, upper-board Y=2.75 m termination and side orthographic sections at matching locations for intersections with treads/guards/baseboards and breaks in the white band.

The landing's outer 0.015×0.015 m square corner X=[−0.65,−0.635], Z=[−3.41,−3.395] m between both boards is this prototype's third closed connector. Its bottom Y=1.180892857 m is the lower corner of the lower-board Z=−3.395 end; top Y=1.469107143 m is the upper corner of the upper-board X=−0.635 start. Lower board meets connector face Z=−3.395 at Y=[1.180892857,1.280892857] m; upper board meets connector face X=−0.635 at Y=[1.369107143,1.469107143] m. Neither board enters connector interiors, and the connector at intermediate heights covers the structural landing side. Vertical end faces close in front of the first riser and at ceiling tangent X=Xc; spaces owns [upper stair-arrival closure](../spaces/02-stair.md#stair-boundary-heights) above. Every front/back/top/bottom/end face of the three boards has `stair-skirt`; [interior trim](../materials/02-interior-shell.md#interior-trim-white) owns white paint. UVs project actual slope length U/board height V at 1 UV/m from each sloped board's first lower corner, restarting thickness/end faces. The landing connector projects separately from each face's bottom-left, breaking seams at the three members' contacts. Current `src/models/stair-skirt.ts` emits these three boards with the stated height formulas; source existence alone supplies no new complete contact or GPU readability verdict.

Across the three sloped/connecting boards, `stair-skirt` thickness is 0.015 m at open-side X=[−0.65,−0.635] m or Z=[−3.41,−3.395] m; front/back/top/bottom/vertical ends close under the preceding height formulas and Xc=1.474705882 m. Closed boards receiving this id meet stair structural sides only at faces without entering structural thickness.

## Surface partitions of guard members {#stair-member-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation Owns baluster/bottom-rail surface ids, flat normals and lengthwise metre UVs.
@evidence principles/core/common.md#substantive-completion States that spaces source owns post/handrail surfaces, preventing duplication.
@evidence principles/core/common.md#declared-basis Receives id rules from 00-model-frame.md#model-surface-partition-naming and color requirements from settings/10-house.md#stair.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Realizes settings' black steel members as two surface ids and lengthwise UVs for powder-coat grain.
@evidence principles/design/models.md#representation-contract Defines stable guard-member surfaces.
@evidence principles/design/models.md#spatial-convention Baluster UVs start at bottom center and bottom-rail UVs at the member's left-end corner, with axes/scales distinguished in the body.
@evidence principles/design/models.md#reviewable-structure Binding views falsify boundaries between posts/balusters.
@evidence principles/design/models.md#model-observable-style-basis Reference 03·04's black balusters are distinct from white stair structure, so only guard-member faces transfer to models; black steel color remains with materials.
@evidence principles/design/models.md#model-scale-layer-completion Defines baluster/bottom-rail surface interfaces while leaving post/handrail surfaces with spaces.
@evidence settings/10-house.md#stair Limits black steel baluster color-binding faces to baluster/bottom-rail, leaving posts/handrails with spaces owners.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes settings stair unchanged without parent revision.
-->

Reference 03·04's black balusters are distinct from white stair structure, so only guard-member faces transfer to models.

Under the [naming rule](00-model-frame.md#model-surface-partition-naming), surface ids are `baluster` and `bottom-rail`. Both are black steel members of [single turning-stair settings](../settings/10-house.md#stair), using flat normals per face and metre UVs for [black-coated metal's powder grain](../materials/02-interior-shell.md#black-coated-metal): `baluster` has bottom-center origin with height U/square circumference V, and `bottom-rail` left-end-corner origin with length U/section circumference V. Spaces source owns post/handrail surfaces. The source owner is `src/models/stair-baluster.ts`.

Material-binding views of the entry's lower flight and upper corridor inspect whether black `baluster`/`bottom-rail` end as faces distinct from white spaces posts and wooden handrails. Actual model meshes/material bindings remain unverified.

## Representation limits of guard members {#stair-member-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation Owns the limit excluding welds, bolts and baseplates from guard members.
@evidence principles/core/common.md#substantive-completion States that baluster repetition proves neither protective performance nor code compliance.
@evidence principles/core/common.md#declared-basis Receives weld/bolt/baseplate omission limits from 00-model-frame.md#model-representation-ceiling.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Converts the common ceiling into a guard-member omission list.
@evidence principles/design/models.md#representation-contract Defines the proxy limit that baluster repetition proves neither protective performance nor code compliance.
@evidence principles/design/models.md#spatial-convention Preceding member H2s own baluster sections/lower-rail heights; this representation-limit H2 defines no new coordinates.
@evidence principles/design/models.md#reviewable-structure Baseplates appearing at baluster ends in model-review side sections falsify the limit.
@evidence principles/design/models.md#model-observable-style-basis Adopts reference 04's readable balusters/lower band but excludes screws/fasteners absent even from photographs, stating the observable limit of omitted welds/bolts.
@evidence principles/design/models.md#model-scale-layer-completion Explicitly identifies welds, bolts and baseplates as unbuilt guard-member layers.
@evidence obligations/design/models.md#representation-ceiling States that guard members certify neither protective performance nor code compliance.
@evidence spaces/02-stair.md#stair-boundary-heights Consumes only geometric gap/lower-empty-height conditions, without extending them into protective-performance/code certification.
@evidence settings/20-verification.md#fidelity Keeps balusters/lower bands readable in captures without treating bolts/welds as proof of realistic function.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Compared settings fidelity and 02-stair's nonclaim of code compliance with guard-member omissions, requiring no parent revision.
-->

Adopt reference 04's readable balusters/lower band, excluding screws/fasteners absent even from photographs.

Within the [representation ceiling](00-model-frame.md#model-representation-ceiling), welds, fixing bolts and baseplates are not made. Baluster repetition proves neither protective performance nor code compliance. The inspection address is the [model-review view list](00-model-frame.md#model-review-set); actual renders remain unverified.
