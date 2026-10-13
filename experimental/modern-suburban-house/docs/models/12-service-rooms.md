# Fixtures and storage prototypes for the powder room, laundry, pantry, and garage

## Drum washer and dryer {#laundry-machine}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns two variants of one washer/dryer prototype, defining body, circular leaf, handle, and controls while omitting drum rotation, detergent drawers, and plumbing.
@evidence principles/core/common.md#substantive-completion It fixes body depth 0.72 m, circular-hole depth 0.102 m, door diameter 0.45 m/centre height 0.42 m, drum diameter 0.36 m/depth 0.06 m, controls X=[−0.325,0.325], Y=[0.76,0.86], Z=[0.720,0.735] m, handle depth 0.750 m, left hinge, and L-shaped rear wall/casing cuts.
@evidence principles/core/common.md#declared-basis Laundry-equipment reservations supply depth 0.75 m, width 0.65 m, height 0.88 m; 90° opening projects 0.45+0.03=0.48 m.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain circular-door pivot door, depth split 0.72 m body plus 0.03 m door/handle, and two variants distinguished only by control markings.
@evidence principles/design/models.md#representation-contract Body, hole cuts, ring leaf, handle, controls, and fixed drum use appliance-body, leaf, door-ring, glass, handle, control-panel, appliance-interior, and drum; rotation, detergent drawers, and plumbing remain outside the proxy.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z front faces world -X after placement; the circular leaf hinges on one vertical tangent and opens toward +Z by at most 90°.
@evidence principles/design/models.md#reviewable-structure Fixed model-review front views distinguish common bodies by control markings; 90° plans require handle ends short of X=4.25 m.
@evidence principles/design/models.md#model-observable-style-basis Without manufacturer or style labels, 0.45 m circular doors and front controls provide the observable drum-appliance silhouette, with appearance handed off through material boundaries.
@evidence principles/design/models.md#model-scale-layer-completion Reserved 0.75×0.65×0.88 m scale, body-hole/ring/fixed-drum hierarchy, door pivot, eight boundaries, omissions, and two unverified observations determine the model.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Washer/dryer X/Z and operating X=[4.25,4.75] remain unchanged; 0.48 m opening fits 0.50 m without a parent defect requiring revision.
@evidence settings/10-house.md#laundry-mudroom Side-by-side front-loading appliances with readable circular doors/controls become two variants of one 0.45 m door prototype with controls Y=[0.76,0.86].
@evidence spaces/rooms/laundry.md#laundry-equipment-use Washer Z=[-3.35,-2.70], dryer Z=[-2.70,-2.05], shared X=[4.75,5.50], Y=[0,0.88] supply bounds; 0.48 m projection fits operating X=[4.25,4.75].
@evidence obligations/design/models.md#addressable-model-decisions Separate H2s own machine, folding top, upper storage, bench, coat hooks, pantry shelves, containers, garage shelves, workbench, and tool board; this H2 owns only the washer/dryer prototype.
@evidence obligations/design/models.md#model-review-set Fixed model-review views assign this prototype front appliance comparison and 90° door plans.
@evidence obligations/design/models.md#articulation-ownership door names the circular leaf's at-most-90° +Z motion interface; body and controls have no joints.
-->

Adopt reference 02's two circular washer/dryer fronts behind the mudroom. Drum rotation and water are unseen functions and remain unrepresented.

Washer and dryer are two variants of one prototype differing only in control markings. The [equipment reservation](../spaces/rooms/laundry.md#laundry-equipment-use) supplies washer X=[4.75,5.50], Z=[-3.35,-2.70] and dryer X=[4.75,5.50], Z=[-2.70,-2.05], both depth 0.75 m, width 0.65 m, Y=[0,0.88]. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply, with +Z front facing world -X after placement.

Parts are the perforated body, ring leaf, handle, controls, and fixed drum behind glass. Body depth is 0.72 m; closed leaf/ring/glass/handle stay within another 0.03 m, completing 0.75 m. At horizontal centre X=0 and height 0.42 m, a real 0.40 m diameter circular hole occupies Z=[0.618,0.720], depth 0.102 m. Cylindrical cuts belong to `appliance-body`, with a radius-0.20 m rear disk at Z=0.618 owned by `appliance-interior`. The 0.36 m drum's rear meets that disk without overlap. `leaf` is a circular frame, outer diameter 0.45 m, inner diameter 0.40 m, thickness 0.018 m, at Z=[0.720,0.738], rather than an opaque disk. A same-diameter metal `door-ring` meets its front at Z=[0.738,0.742]; 0.39 m diameter, 0.004 m thick `glass` occupies that interval inside it. A rear `leaf` lip over radii 0.195–0.200 m and Z=[0.734,0.738] closes the 0.005 m radial gap behind the glass. The handle projects 0.008 m from the leaf front, staying at most 0.03 m beyond the body. The 0.45 m leaf centred at 0.42 m hinges vertically on its front-view left/local -X tangent using `door`, opening toward +Z by at most 90°. Projection 0.45+0.03=0.48 m fits [operating X=[4.25,4.75]](../spaces/rooms/laundry.md#laundry-equipment-use), width 0.50 m. Controls occupy front Y=[0.76,0.86]. Boundaries are `appliance-body`, `leaf`, `door-ring`, `glass`, `handle`, `control-panel`, `appliance-interior`, and `drum`. The visible drum front sits at Z=0.678, 0.060 m behind glass rear Z=0.738. The open-front 16-sided drum occupies Z=[0.618,0.678], outer diameter 0.36 m, depth 0.06 m, wall thickness 0.006 m; exposed perimeter and rear disk belong to `drum` and `appliance-interior`. Body and leaf holes share centres so the drum is visible through glass. Drum rotation, detergent drawers, and plumbing are omitted.

The source owner is `src/models/furnishings/service-rooms.ts`. Observe common bodies distinguished by control markings from the front and, at 90°, handle ends short of X=4.25 m in plan. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Only rear-body local Z=[0,0.015], Y=[0,0.10] m is removed for baseboards. New `appliance-body` recess faces retain that id without moving sides, leaf, drum, or front handle. Rear baseboard meets recess faces; each 0.65 m width, 0.75 m depth, and operating front limit remains fixed. No baseboard is introduced between appliances. At the washer's rear lateral corner beside the [laundry entrance opening](../spaces/rooms/laundry.md#laundry-plan), also remove garage-door casing occupancy X=[-0.325,-0.255], Z=[0,0.015], Y=[0.10,0.88] m. Its 0.07 m width/0.015 m projection joins the lower recess into one L-shaped cut. After placement the union is world X=[5.485,5.50], Z=[−3.35,−3.28], Y=[0,0.88], clearing actual closed casing volume. Front body, rotating leaf, handle, and drum occupancy stay fixed, retaining rough door and appliance-operation widths.

The dryer's local +X end meets the painted front wall at world Z=−2.05 m. Remove a 0.015 m inward strip over Y=[0,0.10] and full Z=[0,0.75], removing its common corner with the rear recess once. The front-wall 0.015×0.10 m baseboard continues below the dryer, while upper side, front, and opening end remain reserved. Washer casing cuts and dryer side cuts apply to different appliances.
Each `control-panel` is a closed shallow band at X=[−0.325,0.325], Y=[0.76,0.86], Z=[0.720,0.735]. Each round 0.040 m diameter `handle` sits at local X=+0.20, Y=0.42, opposite the hinge, over Z=[0.742,0.750]. Controls, handles, and `door-ring` remain inside 0.75 m depth.

## Folding top above laundry appliances {#laundry-folding-top}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the folding top and cleats, leaving two appliances to their H2 and adding no support in front of their leaves.
@evidence principles/core/common.md#substantive-completion It fixes length 1.30 m, depth 0.75 m, thickness 0.06 m, cleat height 0.04 m/depth 0.03 m, world Z=[−3.25,−3.22]/[−2.18,−2.15], and contact after casing cuts.
@evidence principles/core/common.md#declared-basis Reserved X=[4.75,5.50], Z=[-3.35,-2.05], Y=[0.88,0.94] supply bounds; embedded cleat sockets preserve the Y range.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Beyond reserved bounds and no front supports, the top rests on rear-wall cleats and both appliance tops with recessed sockets.
@evidence principles/design/models.md#representation-contract Top and cleats use top/cleat boundaries without joints, front legs, or side panels; edge molding and fastening hardware are omitted.
@evidence principles/design/models.md#spatial-convention The furniture-frame exception puts the origin at the lower rear-edge centre Y=0.88 m; +Z maps to world -X at yaw -π/2.
@evidence principles/design/models.md#reviewable-structure Side review requires no gap between the 0.94 m top and 0.88 m appliance top; front review requires no door-obscuring supports.
@evidence principles/design/models.md#model-observable-style-basis The built-in wall-cleat-supported worktop adopts reference 02 as one 0.06 m panel over appliances without legs or side panels, handing finishes off through top/cleat rather than a style label.
@evidence principles/design/models.md#model-scale-layer-completion Three reserved axes, two parts, two boundaries, no joints, and two observations determine the top without adding unsupported proxy observations.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Top Y=[0.88,0.94] and the prohibition on door-obscuring supports remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#laundry-mudroom The required folding surface becomes one 1.30 m panel above both appliances without front legs.
@evidence spaces/rooms/laundry.md#laundry-equipment-use Reserved X/Z/Y supply bounds; wall-cleat support preserves the unobscured appliance-door condition.
-->

Building classification: built-in. This laundry worktop attaches to wall cleats.

Adopt reference 02's worktop above laundry appliances. Appliance lids and worktop remain distinct surfaces with their actual height difference.

The [reservation](../spaces/rooms/laundry.md#laundry-equipment-use) supplies X=[4.75,5.50], Z=[-3.35,-2.05], Y=[0.88,0.94], giving length 1.30 m, depth 0.75 m, thickness 0.06 m. It follows [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame), except that the origin is the lower rear-edge centre Y=0.88; +Z maps to world -X at yaw -π/2. It rests on rear-wall cleats and both appliance tops, with no front legs or side panels, preserving [unobscured appliance leaves](../spaces/rooms/laundry.md#laundry-equipment-use).

Parts are top and cleats. Cleats along the wall are 0.04 m high and 0.03 m deep, fitting sockets embedded in top thickness to retain the reserved Y range. Boundaries are `top` and `cleat`; there are no joints. Edge molding and cleat fasteners are omitted. The source owner is `src/models/furnishings/service-rooms.ts`. Side views require no gap through the top thickness from appliance top 0.88 m to worktop upper face 0.94 m; front views require no door-obscuring supports. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

The garage-door-side top/cleats avoid the [interior casing](03-interior-doors.md#interior-door-members) at world X=[5.485,5.50], Z=[−3.35,−3.28], Y=[0,2.20]. Remove that 0.015×0.07 m rear-right plan rectangle throughout top Y=[0.88,0.94], closing cuts with `top`; trim overlapping cleat ends and close with `cleat`. Outer X/Z edges and work front remain fixed.
Two `cleat` members sit 0.10 m inward from lengthwise ends at world Z=[−3.25,−3.22]/[−2.18,−2.15], X=[5.47,5.50], Y=[0.88,0.92]. Remove only intersections with the casing cut. Remaining bearing faces meet the top sockets without overlapping panels.

Source stores the prototype pretransformed into house XZ; instances adds only storey-floor Y. One closed `top` mesh excludes the casing corner and both sockets, with `cleat/1` and `cleat/2` contacting socket faces only.

## Laundry upper storage {#laundry-upper-storage}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns one wall-mounted laundry-storage prototype, separate from kitchen upper cabinets because depth and height differ.
@evidence principles/core/common.md#substantive-completion It fixes length 1.30 m, depth 0.30 m, height 0.80 m, 0.28 m carcass plus 0.02 m leaves, and nonprojecting 0.12×0.025×0.012 m lower handle recesses.
@evidence principles/core/common.md#declared-basis Reserved X=[5.20,5.50], Y=[1.50,2.30] supply bounds; lower height 1.50−top 0.94=0.56 m work clearance.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved storage gains body/two-front divisions, lower recessed handles, and rigid leaves.
@evidence principles/design/models.md#representation-contract Carcass and two fronts use carcass/leaf boundaries and rigid leaves; hinges, interior shelves, and detergent containers are omitted.
@evidence principles/design/models.md#spatial-convention The wall-mounted furniture-frame exception puts the origin at the lower rear-edge centre, height 1.50 m.
@evidence principles/design/models.md#reviewable-structure Front model-review views challenge the 0.56 m work clearance below bottom 1.50 m.
@evidence principles/design/models.md#model-observable-style-basis The observable body/front construction follows kitchen upper cabinets, distinguished by 0.30 m depth and 0.80 m height rather than a style label.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, carcass/two-front hierarchy, two boundaries, rigid leaves, and one observation determine the prototype without opening joints.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved X=[5.20,5.50], Z=[-3.35,-2.05], Y=[1.50,2.30] remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#laundry-mudroom Required upper cabinets/shelves become 1.30 m two-leaf wall storage.
@evidence spaces/rooms/laundry.md#laundry-equipment-use Reserved X/Z/Y supply the 1.30×0.30×0.80 m bounds.
-->

Building classification: built-in. These upper cabinets attach to the laundry wall.

Adopt reference 02's upper laundry storage. Its reservation determines dimensions absent from the photograph; interior shelves remain outside this prototype's representation.

The [reservation](../spaces/rooms/laundry.md#laundry-equipment-use) supplies X=[5.20,5.50], Z=[-3.35,-2.05], Y=[1.50,2.30], giving length 1.30 m, depth 0.30 m, height 0.80 m. It uses the [kitchen upper cabinet](10-kitchen-dining.md#kitchen-wall-cabinet) body/front construction but remains a separate prototype for different depth/height. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with the wall-mounted exception of a lower rear-edge centre origin at 1.50 m.

Parts are 0.28 m carcass and two 0.02 m fronts. Each leaf has a horizontally centred lower handle recess 0.04 m above its bottom, width 0.12 m, height 0.025 m, depth 0.012 m, without projection and retaining `leaf`. Boundaries are `carcass`/`leaf`; leaves are rigid. Hinges, interior shelves, and detergent containers are omitted. The source owner is `src/models/furnishings/service-rooms.ts`. Front views require bottom 1.50 m to leave 0.56 m work clearance above the folding top. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

At the garage-door end, remove the union of [interior casing](03-interior-doors.md#interior-door-members) vertical panel X=[5.485,5.50], Z=[−3.35,−3.28], Y=[1.50,2.20] and head panel at the same X/Z, Y=[2.20,2.27]. The cuts meet by face at Y=2.20, leaving only a 0.015×0.07 m corner removed up to 2.27 m. Close remaining cuts with `carcass`. Fronts at room-side X≤5.22 never contact this casing. Reserved X=[5.20,5.50], Z=[−3.35,−2.05], Y=[1.50,2.30] remain unchanged with zero shared casing volume.

`carcass` is the closed east-wall body X=[5.22,5.50], Z=[−3.35,−2.05], Y=[1.50,2.30] after that corner cut. Two `leaf` panels occupy room-side X=[5.20,5.22], Y=[1.50,2.30], Z=[−3.35,−2.70]/[−2.70,−2.05], contacting the body only at X=5.22. They have no positive-volume intersection with casing X≥5.485. Source stores pretransformed house XZ and floor-relative Y; instances adds floor Y without another yaw or wall-centre translation.

## Mudroom shoe bench {#mudroom-bench}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns seat, side panels, shoe shelf, and two pairs of shoes; coat hooks belong to the next H2.
@evidence principles/core/common.md#substantive-completion It fixes seat Y=[0.42,0.45], 0.03 m side panels, shelf top 0.10 m, 0.28×0.10×0.10 m shoe boxes, and empty rear-bottom Z=[0,0.015], Y=[0,0.10].
@evidence principles/core/common.md#declared-basis Reserved X=[3.22,3.62], Z=[-2.85,-2.05] and seat 0.45 m supply length 0.80 m/depth 0.40 m/height 0.45 m; two low shoe boxes are authored proxies.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved bounds/seat height gain seat, two sides, shoe shelf, and two-pair shoe proxies.
@evidence principles/design/models.md#representation-contract Seat, two sides, shelf, and two shoe boxes use seat/carcass/shelf/shoe without joints; laces, sole shapes, and seat-edge chamfers are omitted.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z seating front faces world +X after placement.
@evidence principles/design/models.md#reviewable-structure Fixed side views challenge readability of 0.45 m seat height and the shoe shelf.
@evidence principles/design/models.md#model-observable-style-basis Reference 02's mudroom seat between garage and common area becomes a two-side-supported seat with a low shoe shelf, without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Seat scale, four part kinds, four boundaries, no joints, and side observation determine the bench.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved bench bounds and seat 0.45 m remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#laundry-mudroom Required shoe seating becomes a 0.45 m seat with 0.10 m shoe shelf.
@evidence spaces/rooms/laundry.md#laundry-equipment-use Reserved X/Z and seat 0.45 m supply 0.80×0.40×0.45 m bounds.
@evidence obligations/design/models.md#reference-scale Reserved seat 0.45 m directly determines bench height and seat Y=[0.42,0.45], checked by readable side-view height.
-->

Adopt reference 02's mudroom seat between garage and common area. Bench length fits its reservation rather than the photographed room width.

The [reservation](../spaces/rooms/laundry.md#laundry-equipment-use) supplies X=[3.22,3.62], Z=[-2.85,-2.05], seat 0.45 m, giving length 0.80 m, depth 0.40 m, height 0.45 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z seating front facing world +X after placement.

Parts are seat, two sides, and one shoe shelf. Seat Y=[0.42,0.45]; side thickness 0.03 m. The 0.03 m shelf occupies X=[−0.37,0.37], Z=[0.015,0.40], Y=[0.07,0.10], top 0.10 m. Two pairs of shoes are two low 0.28×0.10×0.10 m boxes on the shelf. Boundaries are `seat`, `carcass`, `shelf`, and `shoe`; there are no joints. Laces, sole geometry, and seat chamfers are omitted. The source owner is `src/models/furnishings/service-rooms.ts`. Side views require readable 0.45 m seat and shoe shelf. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Retain the rear-wall baseboard, clearing both floor-contacting `carcass` sides at local Z=[0,0.015], Y=[0,0.10]. Add no separate rear support. Closed recess faces use `carcass`; seat/shelf fronts and reserved bounds remain fixed. Only the upper rear bench contacts the wall finish.

The front-wall-side local −X end meets the baseboard wall at world Z=−2.05. Remove 0.015 m inward from the 0.03 m side over Y=[0,0.10] and full depth Z=[0,0.40]; also clear that 0.015 m shelf end, closing with `carcass` and `shelf`. Baseboard continues in this side recess while the upper 0.015 m side section supports the seat. Remove the common rear/side corner once, without shifting the body across room boundaries.

## Coat hooks above the bench {#mudroom-coat-hooks}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the board, four hooks, and two hanging coats, omitting textile folds and sleeves.
@evidence principles/core/common.md#substantive-completion It fixes board 0.80×0.10×0.02 m, bottom 1.65 m, hook centres -0.25/-0.08/+0.08/+0.25 m, 0.08 m projection, 0.012 m diameter, world Y=1.715 m, and coat width 0.30 m/depth 0.25 m with hook contacts.
@evidence principles/core/common.md#declared-basis The reservation supplies X/Z and Y=[1.10,1.85]; coat bottoms match its 1.10 m lower limit.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain board bottom 1.65 m, four explicit hook centres, and rounded-panel coat masses.
@evidence principles/design/models.md#representation-contract Board, four hooks, and two coats use board/hook/clothes boundaries, with folds and sleeves omitted.
@evidence principles/design/models.md#spatial-convention The wall-mounted origin is the board's lower wall-face centre; coats occupy [-0.40,-0.10]/[0.10,0.40] m horizontally, 0.20 m apart inside 0.80 m, with total projection within 0.40 m.
@evidence principles/design/models.md#reviewable-structure Side review challenges coat bottoms stopping 0.65 m above the bench seat.
@evidence principles/design/models.md#model-observable-style-basis Reference 02 does not clearly show individual coats; rounded panel masses and 0.08 m hooks define observable abstraction without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Board bottom 1.65 m, coat bottom 1.10 m, three boundaries, no joints, omissions, and side observation determine the prototype.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved X=[3.22,3.62], Z=[-2.85,-2.05], Y=[1.10,1.85] remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#laundry-mudroom Required coat storage becomes four hooks and two hanging coats.
@evidence spaces/rooms/laundry.md#laundry-equipment-use Reserved X/Z/Y contain the combined maximum projection of hooks and coats.
-->

Building classification: built-in. Only the board and four hooks are fixed building hardware; two coats belong to the prop stage after building completion.

Reference 02 does not clearly show individual mudroom coats. The laundry/mudroom use requirement determines four hooks and two coats.

The [reservation](../spaces/rooms/laundry.md#laundry-equipment-use) contains combined hook/coat projection inside X=[3.22,3.62], Z=[-2.85,-2.05], Y=[1.10,1.85]. It follows [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame), except for a wall-mounted origin at the board's lower wall-face centre. The board is 0.80 m long, 0.10 m high, 0.02 m thick, bottom 1.65 m. Four hooks sit -0.25/-0.08/+0.08/+0.25 m from its centre, projecting 0.08 m.

Two coats hang from end hooks -0.25/+0.25 m as rounded panel masses, width 0.30 m, depth 0.25 m, reaching down to Y=1.10 m. Their horizontal occupancy [-0.40,-0.10]/[0.10,0.40] remains 0.20 m apart inside 0.80 m, and total projection remains within 0.40 m. Board faces use `board`, hooks `hook`, coats `clothes`; there are no joints. Folds and sleeves are omitted. The source owner is `src/models/furnishings/service-rooms.ts`. Side views require coat bottoms 0.65 m above the bench seat. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.
Each `hook` centre is 0.065 m above the board bottom, world Y=1.715. A 0.012 m diameter bar projects 0.08 m from the board, joined to a same-diameter upturned 0.025 m end; the two members share only a joining face. Coat tops touch the upturned ends, with bottoms Y=1.10.

Source stores the prototype pretransformed into house XZ; instances adds only storey-floor Y. Closed `board` occupies X=[3.22,3.24], Y=[1.65,1.75], Z=[−2.85,−2.05]; hook Z centres are −2.20/−2.37/−2.53/−2.70. Horizontal bars and vertical ends divide at a 45° miter X+Y=5.035 m, sharing only the boundary ring without tube-volume overlap. Fixed-hardware observations do not establish implementation of cloth parts.

## Pantry L-shaped shelves {#pantry-l-shelf}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns five L-shaped shelf panels and wall cleats; food belongs to the next H2.
@evidence principles/core/common.md#substantive-completion It fixes shelf tops 0.20/0.60/1.00/1.40/1.80 m, thickness 0.03 m, cleat height 0.03 m/depth 0.02 m, and a one-panel corner without posts.
@evidence principles/core/common.md#declared-basis Shelf plans supply rear depth 0.25 m/right depth 0.30 m; the room document supplies five heights.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Two reserved strips become one L-shaped panel supported by wall cleats without corner posts.
@evidence principles/design/models.md#representation-contract Five union-shaped panels and cleats use shelf/cleat boundaries; individual brackets, screws, and front-edge molding are omitted.
@evidence principles/design/models.md#spatial-convention The furniture-frame exception puts the origin at the rear-right two-wall floor corner, with local axes equal to world axes.
@evidence principles/design/models.md#reviewable-structure Top review requires a single-filled L corner; front review requires readable five-level spacing.
@evidence principles/design/models.md#model-observable-style-basis Reference 02's small enclosed kitchen-side pantry becomes a post-free L panel and five levels at 0.40 m intervals, without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Two strips, five heights, two boundaries, no joints, and two observations determine the shelves without unsupported proxy observations.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Both shelf strips and five room heights remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#pantry Required separate shelved food storage becomes five L-shaped rear/right-wall levels.
@evidence spaces/rooms/pantry.md#pantry-plan Shelf bounds union rear X=[3.22,5.50], Z=[-6.05,-5.80] and right X=[5.20,5.50], Z=[-6.05,-4.70].
@evidence spaces/rooms/pantry.md#pantry-storage-use Room heights from 0.20 m at 0.40 m intervals become unchanged tops 0.20/0.60/1.00/1.40/1.80 m.
-->

Building classification: built-in. Cleats fix these shelves to the pantry rear/side walls.

Adopt reference 02's small enclosed kitchen-side pantry. Parent storage reservations determine L dimensions and level count.

The [shelf plan](../spaces/rooms/pantry.md#pantry-plan) unions rear X=[3.22,5.50], Z=[-6.05,-5.80], depth 0.25 m, and right X=[5.20,5.50], Z=[-6.05,-4.70], depth 0.30 m, into one L-shaped panel. This two-wall, single-location prototype is an exception to [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame). Its conceptual origin is the rear-right wall corner on the floor, with world-aligned axes. Source preapplies that transform as house XZ and floor-relative Y, so instances uses p=(0,storey-floor Y,0) m, yaw 0, scale 1.

Parts are five L panels and wall cleats. [Room-defined](../spaces/rooms/pantry.md#pantry-storage-use) tops are 0.20/0.60/1.00/1.40/1.80 m at 0.40 m intervals, with 0.03 m thickness below each top. One panel crosses the corner without posts. Wall cleats beneath each shelf are 0.03 m high, 0.02 m deep. Boundaries are `shelf`/`cleat`; there are no joints.

Individual brackets, screws, and front-edge molding are omitted. The source owner is `src/models/furnishings/service-rooms.ts`. Top views require a single-filled L corner; front views require readable five-level spacing. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

The pantry-side −Z casing of service-pantry-door meets pantry-back-shelf at world X=[3.22,3.235], Z=[−5.82,−5.75], Y=[0,2.20]. Remove each shelf's 0.015×0.020 m front-corner rectangle X=[3.22,3.235], Z=[−5.82,−5.80] throughout panel thickness and remove the same cleat overlap. Close cuts with `shelf`/`cleat`. Other rear/right strips retain bounds, leaving zero casing/shelf intersection.

Each `shelf` extrudes the rear/right union over Y=[h−0.03,h] for h∈{0.20,0.60,1.00,1.40,1.80}, closes it as one panel after the casing cut. Each `cleat` occupies Y=[h−0.06,h−0.03], with rear-wall X=[3.235,5.48], Z=[−6.05,−6.03], and right-wall X=[5.48,5.50], Z=[−6.03,−4.70]. Cleats meet each other only at end faces and contact shelf undersides.

## Pantry food containers {#pantry-containers}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns sealed-container, food-box, and low-basket variants; instances owns counts and placement.
@evidence principles/core/common.md#substantive-completion It fixes container 0.12×0.12×0.20 m, box 0.18×0.18×0.25 m, basket 0.30×0.20×0.15 m.
@evidence principles/core/common.md#declared-basis Room-defined object depths 0.20/0.25 m and height at most 0.30 m above shelves justify variant sizes.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Depth/height limits gain three explicit sizes and body/lid/rim construction.
@evidence principles/design/models.md#representation-contract Container body/lid, one closed wood box, and open rimmed basket use container/lid/box/basket; labels, contents, and transparent-container transmission are omitted.
@evidence principles/design/models.md#spatial-convention Shelf props use the furniture-frame exception of a bottom-centre origin.
@evidence principles/design/models.md#reviewable-structure Fixed model-review views challenge containers remaining inside shelf ends.
@evidence principles/design/models.md#model-observable-style-basis Reference 02 hides pantry contents; lidded container, closed box, and open rimmed basket are three silhouette distinctions without brand or food labels.
@evidence principles/design/models.md#model-scale-layer-completion Three sizes, four boundaries, no joints, delegated counts/placement, and one observation determine the prop prototype.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Object depth/height and 0.02 m shelf-end recess remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#pantry Required food containers/boxes become three container, box, and basket prop variants.
@evidence spaces/rooms/pantry.md#pantry-storage-use Variants fit rear object depth 0.20 m, right depth 0.25 m, and height at most 0.30 m above shelves.
-->

Reference 02 hides pantry contents. Settings and shelf depths determine container, box, and basket prototypes explaining storage function.

One food-prop prototype has sealed-container, small food-box, and low-basket variants. The [room document](../spaces/rooms/pantry.md#pantry-storage-use) limits rear object depth to 0.20 m, right depth to 0.25 m, height to 0.30 m above shelves, and shelf-end recess to 0.02 m. Chosen sizes are container 0.12×0.12×0.20 m, box 0.18×0.18×0.25 m, and basket 0.30×0.20×0.15 m. Shelf props use the bottom-centre origin exception to [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame).

The sealed container has body/lid, the thin solid-wood food box is one closed member, and the basket is an open rimmed box. Boundaries are `container`, `lid`, `box`, and `basket`; there are no joints. Labels, contents, and transparent-container transmission are omitted. The source owner is `src/models/furnishings/service-rooms.ts`; instances owns count/placement. Observe containers remaining inside shelf ends using fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`container` is a 0.12×0.12×0.18 m body topped by a same-plan 0.02 m `lid`, completing 0.20 m. `box` is one closed 0.18×0.18×0.25 m member at X=[−0.09,0.09], Z=[−0.09,0.09], Y=[0,0.25] around its bottom-centre origin. `basket` retains four 0.01 m walls and a 0.015 m bottom within 0.30×0.20×0.15 m bounds. Each bottom-centre origin meets the shelf surface.

## Garage metal shelving {#garage-shelving}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns rear-wall posts/panels and four bins on the lower two levels; workbench and tool board have separate H2s.
@evidence principles/core/common.md#substantive-completion It fixes four 0.04 m square posts, five 0.03 m shelves with tops 0.20–1.80 m, and four 0.40×0.35×0.28 m bins with explicit two-level X/Z contacts.
@evidence principles/core/common.md#declared-basis Rear-storage X=[7.15,8.85], Z=[-6.45,-5.85], and 2.05 m above the floor supply 1.70×0.60×2.05 m bounds.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain four corner posts, five panels, and lower-two-level bin arrangement.
@evidence principles/design/models.md#representation-contract Four posts, five shelves, and four bins use post/shelf/bin without joints; post perforations, bolts, and bin-lid handles are omitted.
@evidence principles/design/models.md#spatial-convention Origin lies on garage floor Y=-0.15 m; +Z faces the shelf front, and bins remain within 0.60 m depth.
@evidence principles/design/models.md#reviewable-structure Side model-review views challenge bins fitting inside 0.60 m depth.
@evidence principles/design/models.md#model-observable-style-basis Reference 02's wall storage is adopted and its two cars rejected under user direction; four 0.04 m posts and thin panels define metal-shelf geometry, handing appearance to post/shelf boundaries.
@evidence principles/design/models.md#model-scale-layer-completion Garage-floor datum, five heights, three boundaries, no joints, and side observation determine the shelves.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Rear-storage X/Z and 2.05 m height remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#garage Required storage in the empty garage becomes a rear-wall 1.70 m five-level metal shelf.
@evidence spaces/rooms/garage-interior.md#garage-storage-use Rear X=[7.15,8.85], Z=[-6.45,-5.85], height 2.05 m above floor supply bounds.
-->

Adopt reference 02's garage-wall storage, rejecting its two cars under user direction. Shelves remain within the empty garage's walking-width reservation.

The [rear storage reservation](../spaces/rooms/garage-interior.md#garage-storage-use) supplies X=[7.15,8.85], Z=[-6.45,-5.85], height 2.05 m above garage floor, giving length 1.70 m, depth 0.60 m, height 2.05 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with origin on garage floor Y=-0.15 and +Z toward the front.

Parts are four 0.04 m square corner posts and five 0.03 m shelf panels. Tops lie 0.20/0.60/1.00/1.40/1.80 m above garage floor at 0.40 m intervals. Four 0.40×0.35×0.28 m bins occupy the lower two levels within body depth. Boundaries are `post`, `shelf`, and `bin`; there are no joints. Post holes, bolts, and bin-lid handles are omitted. The source owner is `src/models/furnishings/service-rooms.ts`. Side views require bins inside 0.60 m depth. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

World post centres are X=7.17/8.83, rear Z=−6.43, front Z=−5.87, aligning 0.04 m sections with reservation ends. Rear faces Z=−6.45 meet the [garage wall finish](../spaces/03-surface-owners.md#interior-surface-handoff). The garage has no baseboard, so posts need no bottom recess.
Two `bin` members sit on each lower shelf, whose tops are 0.20/0.60 m above the floor. Bins use world X=[7.30,7.70]/[8.00,8.40], Z=[−6.35,−6.00], height 0.28 m from each top. Bottoms meet shelf tops and remain separated from posts X=[7.15,7.19]/[8.81,8.85].

## Garage tool workbench {#garage-workbench}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns top, legs, and two drawers; the tool board belongs to the next H2.
@evidence principles/core/common.md#substantive-completion It fixes top thickness 0.04 m, four legs, two 0.50 m drawers filling 1.03 m clear width with a 0.01 m centre gap and 0.01 m end margins, height 0.12 m, travel 0.45 m, and zero recessed-handle projection.
@evidence principles/core/common.md#declared-basis Reserved X=[9.00,10.20], Z=[-6.45,-5.85], top 0.90 m supply 1.20×0.60×0.90 m bounds; operating Z=[-5.85,-5.40] supplies 0.45 m travel.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain top/leg/drawer divisions and two drawer pivots.
@evidence principles/design/models.md#representation-contract Top, four legs, and two drawers use top/leg/drawer-front/handle; drawer rails, vise, and top scratches are omitted.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces work use, and drawer pivots slide at most 0.45 m in +Z.
@evidence principles/design/models.md#reviewable-structure Model-review plans challenge 0.45 m drawer extension avoiding work-use occupancy.
@evidence principles/design/models.md#model-observable-style-basis A 0.04 m top on four legs and two drawers below it provide observable construction without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, three part kinds, four boundaries, two drawer pivots, and extension observation determine the bench.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Workbench and operating reservations remain unchanged; recessed handles add no projection beyond 0.45 m travel, leaving no parent defect.
@evidence settings/10-house.md#garage Required tool storage becomes a 1.20 m workbench with two drawers.
@evidence spaces/rooms/garage-interior.md#garage-storage-use Reserved X/Z and top 0.90 m supply bounds; drawer operating Z=[-5.85,-5.40] sets travel limits.
@evidence obligations/design/models.md#articulation-ownership drawer-left and drawer-right name +Z travel interfaces with a 0.45 m maximum.
-->

Adopt reference 02's garage-wall workbench/tool storage. Parking bays remain empty and drawer travel stays inside the work reservation.

The [reservation](../spaces/rooms/garage-interior.md#garage-storage-use) supplies X=[9.00,10.20], Z=[-6.45,-5.85], top 0.90 m above garage floor, giving length 1.20 m, depth 0.60 m, height 0.90 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z as work front.

Parts are a 0.04 m top, four legs, and two drawers. Centres of 0.05 m square legs sit 0.06 m inward from ends, giving inner width 1.20−2×(0.06+0.025)=1.03 m. Each drawer is 0.50 m wide, 0.12 m high below the top; a 0.01 m centre gap and two 0.01 m margins fill 2×0.50+0.01+2×0.01=1.03 m. `drawer-left`/`drawer-right` slide at most 0.45 m in +Z, matching [operating Z=[-5.85,-5.40]](../spaces/rooms/garage-interior.md#garage-storage-use). Each handle is a horizontally centred panel recess 0.035 m below the upper front edge, width 0.12 m, height 0.025 m, depth 0.015 m, adding no projection; the open front limit equals 0.45 m travel. Boundaries are `top`, `leg`, `drawer-front`, and `handle`. Rails, vise, and top scratches are omitted. The source owner is `src/models/furnishings/service-rooms.ts`. Extended plans require no overlap with work-use occupancy. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

World leg centres are X=9.06/10.14, rear Z=−6.405, front Z=−5.895. The 0.05 m square rear edge Z=−6.430 remains 0.020 m from rear-wall Z=−6.45. Legs rise from garage floor Y=−0.15 to top underside Y=0.71.

## Tool board above the workbench {#garage-tool-board}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the pegboard, hammer/wrench/saw silhouettes, and two small bins.
@evidence principles/core/common.md#substantive-completion It fixes board 1.20×1.00 m, thickness 0.02 m, total depth 0.15 m, tool projection at most 0.13 m, saw blade X=[0,0.24]/grip X=[0.24,0.32] within 0.32 m, wrench body 0.025 m/jaws 0.06 m, and saw centre (0.30,0.58) m.
@evidence principles/core/common.md#declared-basis Reserved X=[9.00,10.20], Z=[-6.45,-6.30], world Y=[0.95,1.95] supply bounds; three tools and two bins are authored choices.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain board thickness, three hanging silhouettes, and two bins.
@evidence principles/design/models.md#representation-contract Board, three tools, and two bins use board/tool-steel/tool-grip/bin, with numeric bounds for every tool/bin.
@evidence principles/design/models.md#spatial-convention The wall-mounted origin is the lower wall-face centre; all tools stay within 0.13 m beyond the board front.
@evidence principles/design/models.md#reviewable-structure Side views challenge total projection within 0.15 m; front views challenge distinction of three silhouettes.
@evidence principles/design/models.md#model-observable-style-basis Hammer/wrench/saw panel silhouettes define abstraction; material boundaries own metal and grip appearance.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, 0.15 m depth, four boundaries, tool/bin bounds and positions, no joints, and two observations determine the board.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved X/Z and world Y=[0.95,1.95] remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#garage Required tool storage becomes a pegboard with three hanging silhouettes and two bins.
@evidence spaces/rooms/garage-interior.md#garage-storage-use Reserved X/Z/Y supply 1.20×1.00×0.15 m bounds.
@evidence obligations/design/models.md#representation-ceiling Tool forms remain 0.02–0.04 m thick panel silhouettes, so this model does not support judgments of actual detailed tool geometry.
@evidence obligations/design/models.md#model-representation-completion All ten prototypes name src/models/furnishings/service-rooms.ts as source owner and model-review views as observation owner; unverified observations claim neither structural validity nor semantic completion.
-->

Adopt reference 02's garage-storage silhouette as a tool board. Use this H2's chosen silhouettes and two bins rather than counting tools in the photograph.

Closed `tool-steel` members form a 0.12×0.035×0.035 m hammer head, a wrench with 0.06×0.30×0.025 m overall body/jaws, and saw blade local X=[0,0.24], Y=[0.02,0.14], depth 0.030 m. `tool-grip` forms a 0.025×0.32×0.025 m hammer handle and saw grip X=[0.24,0.32], Y=[0.03,0.13], depth 0.030 m, contacting metal ends by face. Each `bin` has 0.16×0.12×0.10 m bounds. Material ids attach only to these shaped/dimensioned members; `board` is 1.20×1.00×0.02 m.

The [reservation](../spaces/rooms/garage-interior.md#garage-storage-use) supplies X=[9.00,10.20], Z=[-6.45,-6.30], world Y=[0.95,1.95], giving length 1.20 m, height 1.00 m, total depth 0.15 m. It follows [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame), except for the wall-mounted lower-centre origin. Board thickness is 0.02 m; hanging members are hammer, wrench, saw, and two small bins. Local +X is right, +Y up, +Z toward the room. Hammer bounds 0.12×0.36×0.035 m centre at (-0.35,0.57); wrench 0.06×0.30×0.025 at (-0.05,0.60); saw 0.32×0.16×0.030 at (0.30,0.58). Each 0.16×0.12×0.10 m bin centres at X=-0.24/+0.24, bottom Y=0.12. All tool/bin fronts lie within 0.13 m of the board front.

Boundaries are `board`, `tool-steel`, `tool-grip`, and `bin`; there are no joints. Hammer head is 0.12×0.035 m with 0.025×0.32 m handle; wrench jaws are 0.06 m wide and shaft 0.025 m. Taking the saw's lower-left as origin, blade X=[0,0.24], Y=[0.02,0.14] meets grip X=[0.24,0.32], Y=[0.03,0.13] at its end. Width 0.24+0.08=0.32 m and both heights remain within 0.16 m. The source owner is `src/models/furnishings/service-rooms.ts`. Side views require projection within 0.15 m; front views distinguish all three silhouettes. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.
The wrench `tool-steel` shaft is 0.025 m wide at centre X=−0.05, Y=[0.47,0.73]; two 0.06 m wide, 0.02 m high jaws meet it at Y=[0.45,0.47]/[0.73,0.75]. Their union matches height 0.30 m/width 0.06 m. The saw occupies board-local X=[0.14,0.46], Y=[0.50,0.66], matching centre (0.30,0.58).
