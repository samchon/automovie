# Kitchen and dining furniture and fixture prototypes

## Kitchen base-cabinet run {#kitchen-base-run}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the L-run's 3.35, 0.30, and 1.30 m lengths, plinth, carcass, leaves, drawer fronts, handles, countertop, six material boundaries, blocking limits, and observations; tile backsplash remains a wall finish outside the prototype.
@evidence principles/core/common.md#substantive-completion It fixes 0.65 m depth, 0.91 m top height, carcass Y=[0.10,0.88] and 0.60 m depth, handle front Z=0.64 m, a 0.15 m drawer band, and round(L/0.60 m) bays; shared furniture rules supply handle sections.
@evidence principles/core/common.md#declared-basis The wall-kitchen reservation supplies 0.65 m depth and 0.91 m height; kitchen-equipment's readability requirement justifies drawers and projecting handles, while bay widths are authored here.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The two reserved strips gain three segments with one rear-run corner owner, a 0.07 m recessed plinth, and drawer/leaf front divisions.
@evidence principles/design/models.md#representation-contract Parts and plinth, carcass, leaf, drawer-front, handle, and countertop boundaries are fixed; blocking omits hinges, drawer rails, tap plumbing, and plinth-height adjustment.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces the user; carcass front Z=0.62 m, handle front Z=0.64 m, and countertop Y=[0.88,0.91] stay within 0.65 m reserved depth.
@evidence principles/design/models.md#reviewable-structure Side orthographic views expose 0.91 m top height, baseboard recess, and 0.03 m top overhang; plans expose the three-segment union and single-filled corner, while leaves and drawers expose no joints.
@evidence principles/design/models.md#model-observable-style-basis Reference 03's grey-brown base cabinets and pale top become a 0.15 m drawer band above leaves and horizontal bar handles projecting 0.02 m, tied to review-distance distinction rather than a style label.
@evidence principles/design/models.md#model-scale-layer-completion Reserved 0.65/0.91 m scale, six parts, rigid unjointed leaves/drawers, six material boundaries, blocking limits, and side/plan observations cover the representation layers.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The authored design consumes rear Z=[-10.45,-9.80], left X=[-5.50,-4.85], Y=[0,0.91], and drawer/leaf/handle distinction unchanged; three segments fill both strips without gaps, requiring no parent revision.
@evidence settings/10-house.md#kitchen-equipment The L-shaped lower storage becomes a length-L prototype; the requirement to distinguish drawers, leaves, and handles becomes the 0.15 m drawer band and 0.02 m handle projection.
@evidence spaces/rooms/common.md#common-kitchen-wall-reservation The rear/left strips' 0.65 m width and Y=[0,0.91] supply depth/height; handle front Z=0.64 m stays inside their required handle-inclusive outline.
@evidence obligations/design/models.md#addressable-model-decisions kitchen-base-run owns its lengths, parts, boundaries, limits, and observations; separate H2s own upper cabinets, refrigerator, range, microwave, island, dishwasher, stool, table, and chair.
@evidence obligations/design/models.md#model-review-set Fixed model-review views judge 0.91 m side height and the three-piece plan union independently of dramatic composition; the other nine H2s use the same fixed-view set.
-->

Building classification: built-in. These base cabinets are installed against the kitchen walls and floor.

Adopt reference 03's grey-brown cabinet run and pale countertop. Actual island and wall-cabinet bay widths derive from parent reservation lengths rather than photograph measurements.

The L-shaped lower storage from [kitchen equipment](../settings/10-house.md#kitchen-equipment) uses one length-L prototype. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply, with +Z facing the user's work position. Depth 0.65 m and top height 0.91 m come directly from the [wall-kitchen reservation](../spaces/rooms/common.md#common-kitchen-wall-reservation): rear Z=[-10.45,-9.80], left X=[-5.50,-4.85], and both strips Y=[0,0.91]. Segment lengths are rear 3.35 m, left-rear 0.30 m, and left-front 1.30 m. The rear run alone owns the crossing corner; the left-rear piece begins in front of it, avoiding a duplicate corner body.

Parts are `plinth`, carcass, leaves and drawer fronts, handles, and countertop. The 0.10 m plinth recesses 0.07 m from carcass front Z=0.62 m to Z=0.55 m, taking the rear wall finish as local Z=0. Its depth is Z=[0.015,0.55] m, leaving the rear 0.015 m to the separate [wall baseboard](06-interior-trim.md#wall-baseboard). Pieces ending against perpendicular painted walls also leave 0.015 m inward from their local X end over Y=[0,0.10] m. Rear and left runs continue their walls' exposed baseboards behind them, including beside the range/refrigerator and at rear-run end X=−2.15 m. The two baseboard runs meet once at a 45° miter. `carcass` occupies Y=[0.10,0.88], depth 0.60 m; a 0.02 m front panel reaches Z=0.62 m. Horizontal handles project another 0.02 m to Z=0.64 m. The countertop occupies Y=[0.88,0.91], depth 0.65 m, matching the reserved outline and [including handles/front projections within it](../spaces/rooms/common.md#common-kitchen-wall-reservation). Fronts divide into a 0.15 m drawer band below the top and leaves below that. The lengthwise bay count is round(L/0.60 m): six bays of 0.558333… m for 3.35 m, two of 0.65 m for 1.30 m, and one for 0.30 m. Each bay has one upper drawer and one lower leaf, with handles horizontally centred on their fronts. [Kitchen equipment](../settings/10-house.md#kitchen-equipment) requires review-distance distinction of drawers, leaves, and handles, justifying these divisions and projections; bay widths are this layer's choices. Tile backsplash is a wall finish outside the prototype.

Material boundaries are `plinth`, `carcass`, `leaf`, `drawer-front`, `handle`, and `countertop`; materials chooses color and optics. Leaves and drawers are rigid without hinges or rails, since settings and room documents reserve no lower-cabinet leaf operation. The prototype exposes no joints. This run has no sink or range cut; a separate range fills the left strip's gap. Blocking omits hinges, drawer rails, tap plumbing, and adjustable plinth feet.

The source owner is `src/models/furnishings/kitchen-dining.ts`. Observe 0.91 m top height, baseboard recess, and 0.03 m countertop overhang in side orthographic views; compare the three-segment plan union against both L reservations for gaps/overlaps and a single-filled corner. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Each length-L `plinth` occupies Y=[0,0.10], Z=[0.015,0.55] m; `carcass` occupies Y=[0.10,0.88], Z=[0.015,0.60] m. With n=round(L/0.60), each `drawer-front` spans its whole L/n bay width and Y=[0.73,0.88], Z=[0.60,0.62] m; its lower `leaf` uses the same width and Y=[0.10,0.73], Z=[0.60,0.62] m. Each front's `handle` centres the shared [0.12×0.012 m furniture bar](00-model-frame.md#model-furniture-local-frame), ending at Z=0.64 m. Each `countertop` is L×0.65×0.03 m at Y=[0.88,0.91]. Fronts and tops share contact faces without duplicating volume.

## Kitchen wall cabinet {#kitchen-wall-cabinet}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the 1.30 m left and 0.85 m rear wall-cabinet variants, carcass/leaf/handle parts, material boundaries, and nonoverlap with refrigerator/microwave reservations.
@evidence principles/core/common.md#substantive-completion It fixes mounting height 1.45 m, height 0.90 m, depth 0.31+0.02+0.02=0.35 m, two left leaves and one rear leaf, and handle supports/bars over Y=[0.04,0.16] m with bar centre Z=0.344 m.
@evidence principles/core/common.md#declared-basis Wall-kitchen reservations supply 0.35 m depth and Y=[1.45,2.35]; kitchen-equipment's upper/lower handle distinction justifies the projections.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved X=[-5.50,-5.15] and Z=[-10.45,-10.10] gain 0.31/0.02/0.02 m depth divisions, leaf counts, and lower-free-corner vertical handles.
@evidence principles/design/models.md#representation-contract Carcass, leaves, and handles have carcass, leaf, and handle boundaries, including the visible underside in carcass; rigid leaves have no joints, and hinges, interior shelves, and between-leaf gap shadows are omitted.
@evidence principles/design/models.md#spatial-convention The wall-mounted exception puts the origin at the lower centre of the rear edge and mounts it at 1.45 m, confining occupancy to Y=[1.45,2.35] and 0.35 m depth.
@evidence principles/design/models.md#reviewable-structure Front orthographic review exposes bottom 1.45 m, top 2.35 m, the 0.54 m gap above base tops, and the rear cabinet ending at the kitchen window's right edge.
@evidence principles/design/models.md#model-observable-style-basis Reference 03's window-flanking cabinets become lower-corner vertical handles projecting 0.02 m and two-left/one-rear leaf divisions, without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Mounting scale, three parts, rigid leaves, three boundaries including undersides, and two front observations supply the representation layers.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The design retains left X=[-5.50,-5.15], rear Z=[-10.45,-10.10], and Y=[1.45,2.35]; lengths 1.30/0.85 m avoid refrigerator/microwave reservations without parent revision.
@evidence settings/10-house.md#kitchen-equipment Review-distance distinction of upper/lower handles becomes vertical lower-corner handles projecting 0.02 m.
@evidence spaces/rooms/common.md#common-kitchen-wall-reservation Left X=[-5.50,-5.15], short rear Z=[-10.45,-10.10], and both Y=[1.45,2.35] supply 0.35 m depth and 0.90 m height.
-->

Building classification: built-in. These upper cabinets attach to kitchen walls.

Adopt reference 03's cabinets beside the window, retaining its reservation rather than placing a tall cabinet across it.

One length-L prototype forms the wall cabinet. It follows [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame), except that its wall-mounted origin is the lower centre of the rear edge, mounted at 1.45 m. Depth 0.35 m and height 0.90 m come from the [wall-kitchen reservation](../spaces/rooms/common.md#common-kitchen-wall-reservation): left X=[-5.50,-5.15], short rear Z=[-10.45,-10.10], and both Y=[1.45,2.35]. Lengths are left 1.30 m and rear 0.85 m.

Parts are carcass, leaves, and handles. Depth combines 0.31 m carcass, 0.02 m front panel, and 0.02 m lower-corner vertical handle projection into 0.35 m. The left variant has two leaves and the rear variant one. [Kitchen equipment](../settings/10-house.md#kitchen-equipment) justifies protruding handles for upper/lower distinction at review distance. Each `handle` is a vertical 0.012 m diameter, 0.12 m bar, 0.04 m inward from its leaf's free edge and Y=[0.04,0.16] m above its bottom. Bar centre Z=0.344 m and radius 0.006 m put its front at Z=0.35 m. A short 0.008 m support joins leaf front Z=0.33 m to bar rear Z=0.338 m. Material boundaries are `carcass`, `leaf`, and `handle`; the visible underside belongs to `carcass`. Leaves are rigid and unjointed.

The closed `carcass` occupies local X=[−L/2,L/2], Y=[0,0.90], Z=[0,0.31] m, with its rear at each wall reservation's starting face. `leaf` panels use the same X/Y and Z=[0.31,0.33] m. Two-leaf panels meet only at their end faces at X=0; the single-leaf version covers the full width. Carcass and leaves touch only at Z=0.31 m, and handle fronts stay within 0.35 m reserved depth.

Prototype lengths, rather than placement corrections, preserve nonoverlap with refrigerator and microwave reservations. Hinges, interior shelves, and between-leaf gap shadows are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. In front orthographic views, observe bottom 1.45 m and top 2.35 m, the 0.54 m gap above base tops, and the rear cabinet stopping at the kitchen window's right edge. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

## Double-door refrigerator {#kitchen-refrigerator}
<!--
@evidence principles/core/common.md#scope-preservation One H2 owns refrigerator bounds, two upper leaves/lower drawer/three handles, three pivots and operating ranges, five material boundaries, interior limits, and three observations.
@evidence principles/core/common.md#substantive-completion It fixes depths 0.72/0.05/0.03 m, drawer Y=[0.05,0.75], leaves Y=[0.77,1.85], leaf width 0.47 m, centre gap 0.005 m, hinge axes X=±0.4725 and Z=0.77 m, drawer travel 0.55 m, and a 0.015×0.10 m rear-bottom baseboard recess.
@evidence principles/core/common.md#declared-basis Reserved X=[-5.50,-4.70], Z=[-7.40,-6.45], Y=[0,1.85] supply bounds; the depth split is authored here, and 90° opening occupies 0.47+0.03=0.50 m within 0.55 m.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain two upper leaves, a lower drawer, outer-vertical-edge hinge pivots, and +Z drawer travel of 0.55 m.
@evidence principles/design/models.md#representation-contract The body parents two leaves, a drawer, and three handles; appliance-body, leaf, drawer-front, handle, and open-state appliance-interior boundaries use one empty-box interior proxy.
@evidence principles/design/models.md#spatial-convention Local +Z faces world +X after placement; bounds are 0.95×0.80×1.85 m, hinges use each leaf's outer vertical edge, and the drawer moves +Z.
@evidence principles/design/models.md#reviewable-structure Review exposes closed handle-front depth 0.80 m, 90° leaves and 0.55 m drawer travel within X=-4.15 m, and a body projecting 0.15 m beyond adjacent base cabinets.
@evidence principles/design/models.md#model-observable-style-basis Reference 03's left stainless refrigerator becomes upper paired leaves, a lower drawer, a 0.005 m centre gap, and a 0.15 m cabinet projection, without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Reserved scale, body/leaf/drawer/handle hierarchy, door-left/door-right/drawer interfaces, five boundaries, interior-proxy limits, and three observations leave no representation layer undecided.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The design retains refrigerator bounds and operating X=[-4.70,-4.15]; 0.50 m opening fits the 0.55 m reservation without parent revision.
@evidence spaces/rooms/common.md#common-kitchen-wall-reservation Reserved X=[-5.50,-4.70], Z=[-7.40,-6.45], Y=[0,1.85] supply bounds; 0.50 m leaf opening and 0.55 m drawer travel fit operating X=[-4.70,-4.15].
@evidence obligations/design/models.md#articulation-ownership door-left and door-right expose outer-edge 90° hinges, drawer exposes +Z travel at most 0.55 m, and three handles remain rigidly attached to their members.
@evidence obligations/design/models.md#representation-ceiling Shelves, lighting, and gaskets are omitted; one empty appliance-interior box shows opening occupancy and body projection without claiming refrigerator interior composition.
-->

Adopt reference 03's left stainless double-door refrigerator. Reflection images and branding are not reproduced as geometry or surfaces.

The [reservation](../spaces/rooms/common.md#common-kitchen-wall-reservation) directly supplies X=[-5.50,-4.70], Z=[-7.40,-6.45], Y=[0,1.85]. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply, with +Z front facing world +X after placement. Local bounds are width 0.95 m, depth 0.80 m, height 1.85 m. This layer divides depth into 0.72 m body, 0.05 m leaf, and 0.03 m handle.

The body parents two upper leaves, one lower drawer, and three handles. Drawer front Y=[0.05,0.75]; upper leaves Y=[0.77,1.85]. Each leaf is 0.47 m wide, with a 0.005 m central gap and 0.0025 m body-edge gap on each side: 2×0.47+0.005+2×0.0025=0.95 m. Each leaf hinges at its outer vertical edge. At 90°, leaf width 0.47 m plus handle 0.03 m occupies 0.50 m within the [0.55 m operating reservation X=[-4.70,-4.15]](../spaces/rooms/common.md#common-kitchen-wall-reservation). The drawer slides at most 0.55 m in +Z. `door-left`, `door-right`, and `drawer` are stable motion interfaces; handles are rigidly fixed to their members.

Material boundaries are `appliance-body`, `leaf`, `drawer-front`, `handle`, and open-state-only `appliance-interior`. Interior shelves, lighting, and gaskets are omitted; `appliance-interior` is one empty box. The source owner is `src/models/furnishings/kitchen-dining.ts`. Observe closed handle fronts within 0.80 m in side view; leaves at 90° and drawer at 0.55 m staying inside X=-4.15 m in plan; and the 0.15 m body projection beyond adjacent base cabinets from the passage side. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Retain the rear bound where baseboard is exposed. Only the `appliance-body` rear-bottom strip at local Z=[0,0.015], Y=[0,0.10] m is removed. Body above, sides, front leaves, drawer, and handles retain 0.95×0.80×1.85 m bounds. Cut surfaces remain `appliance-body` and meet the 0.015 m projecting baseboard without overlap. The whole body is not shifted forward, preserving 0.50 m leaf opening and 0.55 m drawer travel.

Each `leaf` is 0.47 m wide, 1.08 m high, 0.05 m thick, at Y=[0.77,1.85], Z=[0.72,0.77] m. Vertical `door-left`/`door-right` hinge axes intersect outer X=−0.4725/+0.4725 m with front Z=0.77 m. Leaves open toward local +Z from those front edges without sweeping the rear body. `drawer-front` is 0.95×0.70×0.05 m at Y=[0.05,0.75], Z=[0.72,0.77] m. Each panel carries a vertical 0.25 m long, 0.020 m diameter `handle` with total 0.03 m projection ending at Z=0.80 m. The drawer handle is horizontally centred at Y=0.40 m; leaf handles sit 0.06 m from free edges at Y=1.31 m.

The exposed `appliance-interior` is an empty-box lining 0.89 m wide, 0.66 m deep, 1.02 m high. Leaving 0.03 m on both sides and at the rear gives X=[−0.445,0.445], Z=[0.03,0.69], Y=[0.80,1.82] m. Front Z=0.72 m remains an open face exposed only when leaves open. Interior shelves and drawer contents are omitted.

## Range and lower oven {#kitchen-range}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns range/oven bounds, cooktop, four burner rings, controls, oven leaf/handle, oven-door pivot, boundaries, limits, three observations, and the reason for omitting a rear control panel.
@evidence principles/core/common.md#substantive-completion It fixes 0.80×0.65×0.91 m bounds, cooktop Y=[0.88,0.91], 0.20 m burners no taller than 0.01 m, a 0.68 m wide/0.04 m thick leaf at Y=[0.10,0.62], recessed horizontal handle, control band Y=[0.66,0.86], and 0.015×0.10 m rear-bottom recess.
@evidence principles/core/common.md#declared-basis Reserved X=[-5.50,-4.85], Z=[-9.50,-8.70], Y=[0,0.91] supply bounds; a rear panel would exceed the height cap, and 0.52 m leaf height plus zero recessed-handle projection stays 0.03 m inside the 0.55 m operating cap.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain four burner rings, a front-upper control band, and a lower-edge horizontal oven hinge.
@evidence principles/design/models.md#representation-contract Body, cooktop, four rings, controls, leaf, and handle have eight boundaries; flame, heat, glass transmission, and individual control-knob geometry are omitted.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces the oven front; its lower-edge horizontal pivot opens downward toward +Z by at most 90°.
@evidence principles/design/models.md#reviewable-structure Review compares the 0.91 m top with adjacent cabinets, opened-leaf occupancy against X=-4.30 m, and four burners from above.
@evidence principles/design/models.md#model-observable-style-basis Four 0.20 m rings on a flat cooktop without a rear panel, plus front-upper controls, are observable form decisions rather than a style label.
@evidence principles/design/models.md#model-scale-layer-completion Reserved scale, six part groups, oven-door interface, eight boundaries, flame/glass limits, and three observations cover the representation layers.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Bounds and operating X=[-4.85,-4.30] remain unchanged; 0.52 m leaf plus zero recessed-handle projection is 0.03 m less than the 0.55 m parent cap, requiring no revision.
@evidence spaces/rooms/common.md#common-kitchen-wall-reservation The 0.91 m cap excludes a rear panel; the recessed-handle leaf's 0.52 m opening stays within the 0.55 m reservation X=[-4.85,-4.30].
@evidence obligations/design/models.md#articulation-ownership oven-door is this H2's sole named pivot: a lower-edge horizontal hinge opening downward toward +Z by at most 90°.
-->

Adopt reference 03's wall range and lower oven. Flame and actual heat are not inferred from the image, and no operating system function is claimed.

The [reservation](../spaces/rooms/common.md#common-kitchen-wall-reservation) supplies X=[-5.50,-4.85], Z=[-9.50,-8.70], Y=[0,0.91], yielding width 0.80 m, depth 0.65 m, height 0.91 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z as oven front. A rear control panel would exceed the 0.91 m cap, so controls use the front-upper band.

Parts are body, cooktop, four burner rings, front controls, oven leaf, and handle. Cooktop Y=[0.88,0.91]; four 0.20 m diameter, 0.01 m thick rings are embedded at Y=[0.90,0.91] without exceeding the top. Within local X=[-0.40,0.40], Z=[0,0.65] m, centres use all four combinations of X=±0.20 and Z=0.19/0.46 m, leaving at least 0.10 m side and 0.09 m front/rear margins. The 0.52 m high oven leaf occupies Y=[0.10,0.62] and opens down toward +Z by at most 90° on lower-edge horizontal pivot `oven-door`. Its upper-edge recessed handle adds no projection, so 0.52 m open occupancy stays 0.03 m within [operating X=[-4.85,-4.30]](../spaces/rooms/common.md#common-kitchen-wall-reservation). `control-panel` is a 0.80×0.20×0.02 m panel at local X=[−0.40,0.40], Y=[0.66,0.86], Z=[0.63,0.65] m; remove the same front cell from the body to meet it.

`leaf` is 0.68 m wide and 0.04 m thick at X=[−0.34,0.34], Y=[0.10,0.62], Z=[0.61,0.65] m, hinged along local X at Y=0.10, Z=0.65 m. `handle` is a 0.48×0.04×0.01 m recess 0.04 m below the leaf top at X=[−0.24,0.24], Y=[0.56,0.60], Z=[0.64,0.65] m. Its bottom and four reveals belong to `handle` and do not project beyond the leaf. Conservative 90° occupancy is 0.52 m leaf height; closed Z depth remains 0.65 m.

Open-state `appliance-interior` is an empty box of width X=0.64 m, height Y=0.48 m and depth Z=0.53 m at X=[−0.32,0.32], Y=[0.12,0.60], Z=[0.08,0.61] m. Remove that volume from `appliance-body` and fit 0.02 m side, top, bottom, and rear linings to its boundaries. Front Z=0.61 m is an actual opening exposed by the leaf; the closed leaf touches its front only by face. Shelves and heating coils are omitted.

A 0.48×0.24 m black heat-resistant `appliance-glass` panel fits flush in the leaf centre, leaving at least 0.06 m metal `leaf` border on all sides. The glass is an opaque black reflector without oven-interior transmission. Boundaries are `appliance-body`, `cooktop`, `burner`, `control-panel`, `leaf`, `appliance-glass`, `handle`, and `appliance-interior`. Flame, heat, glass transmission, and individual control-knob shapes are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. Observe top alignment at 0.91 m in side view, the 90° leaf/handle staying inside X=-4.30 m with 0.03 m clearance, and four readable burners from above. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Retain the rear bound and remove only `appliance-body`'s rear-bottom Z=[0,0.015], Y=[0,0.10] m strip to meet the baseboard. Top, sides, front, and hinge axis remain fixed, preserving 0.65 m depth, 0.91 m height, and 0.55 m operating reservation. The new rear/top cut faces belong solely to `appliance-body`.

## Microwave above the range {#kitchen-microwave}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns wall-mounted microwave bounds, body/leaf/control parts, material boundaries, observations, and the underside's hood role without a separate hood prototype.
@evidence principles/core/common.md#substantive-completion It fixes 0.80×0.40×0.40 m bounds and flush front divisions of 0.58 m left leaf and 0.22 m right controls.
@evidence principles/core/common.md#declared-basis Reserved X=[-5.50,-5.10], Z=[-9.50,-8.70], Y=[1.45,1.85] supply bounds; no room-document leaf-operation reservation justifies a rigid leaf.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain 0.58/0.22 m leaf/control divisions and a combined hood underside.
@evidence principles/design/models.md#representation-contract Body, leaf, and controls use appliance-body, leaf, appliance-glass, and control-panel boundaries; rigid leaves expose no joints, and turntable, interior light, and glazing transmission are omitted.
@evidence principles/design/models.md#spatial-convention The wall-mounted exception places the origin at the lower rear-edge centre, mounting at 1.45 m; leaf and controls lie flush with the body front.
@evidence principles/design/models.md#reviewable-structure Review exposes 0.54 m clearance above the cooktop in side view and nonoverlap with adjacent upper cabinets in front view, with four surface boundaries.
@evidence principles/design/models.md#model-observable-style-basis Reference 03's microwave above the range and below upper cabinets becomes a flush front and flat hood underside, without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Mounting scale, three parts, rigid leaf, four boundaries, and two observations provide the blocking layers.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved bounds remain unchanged; absent parent operation reservations become a rigid leaf, requiring no parent revision.
@evidence spaces/rooms/common.md#common-kitchen-wall-reservation X=[-5.50,-5.10], Z=[-9.50,-8.70], Y=[1.45,1.85] supply bounds; the absence of a leaf-operation reservation makes the leaf rigid.
-->

Adopt reference 03's microwave above the range and beneath upper cabinets. Its dark front glass is not interpreted as a transparent interior.

The [reservation](../spaces/rooms/common.md#common-kitchen-wall-reservation) supplies X=[-5.50,-5.10], Z=[-9.50,-8.70], Y=[1.45,1.85], giving width 0.80 m, depth 0.40 m, height 0.40 m. It follows [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame), except that the wall-mounted origin is the lower rear-edge centre, mounted at 1.45 m. The flat underside doubles as the range hood without a separate hood prototype.

Parts are body, leaf, and controls. The leaf takes the left 0.58 m and controls the right 0.22 m, both flush with the body front. A horizontally/vertically centred `appliance-glass` window is 0.40×0.22 m, leaving 0.09 m `leaf` borders on all four sides. Since the room document reserves no leaf operation, it remains rigid and exposes no joint. Boundaries are `appliance-body`, `leaf`, `appliance-glass`, and `control-panel`.

Turntable, interior light, and glazing transmission are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. Front views compare microwave Z=[-9.50,-8.70] with left upper cabinet Z=[-8.70,-7.40] at common height 1.45–1.85 m, requiring contact only at Z=-8.70 without overlap. Side views require 0.54 m empty clearance above the cooktop. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

## Sink island {#kitchen-island}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns island bounds, top, storage body, knee space, sink cut/bowl, faucet, dishwasher void, boundaries, and three observations; the dishwasher appliance has a separate H2.
@evidence principles/core/common.md#substantive-completion It fixes 2.25×1.05×0.91 m, depths 0.71 m body/0.02 m front/0.02 m handle/0.30 m knee space, a 0.50×0.50 m sink cut and body void, 0.20 m bowl depth, 0.35 m faucet, and a dishwasher bay 0.65–1.25 m from the rear end with 0.60 m depth.
@evidence principles/core/common.md#declared-basis Bounds, knee space, and sink position come from the island reservation; 0.35 m faucet height above the top is authored below the 1.31 m cap.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain yaw -π/2 conventions, a 0.75 m work-side split into 0.71/0.02/0.02 m, 0.30 m seating-side knee space, sink/faucet geometry, and a dishwasher void.
@evidence principles/design/models.md#representation-contract Parts are 0.10 m plinth, body, top, bowl, and faucet with named boundaries; the bowl is a 0.20 m deep open box, dishwasher bay stays empty, and no end column/wall exists; drain, individual faucet controls, and edge molding are omitted.
@evidence principles/design/models.md#spatial-convention The rear edge is the seating-side outline and +Z the work face; yaw -π/2 maps +Z to world -X and +X to world +Z, with parts measured from the rear end and work face.
@evidence principles/design/models.md#reviewable-structure Review exposes full-length 0.30 m knee space, a 0.05 m sink/dishwasher-bay separation in plan, and faucet height at most 1.26 m.
@evidence principles/design/models.md#model-observable-style-basis Reference 03's pale top, island sink, and guest-side knee space become one top without end columns/walls, 0.30 m knee clearance, and a faucet spout bent toward the work face.
@evidence principles/design/models.md#model-scale-layer-completion Reserved scale, orientation, parts, dishwasher-bay interface, boundaries, and three observations supply the representation layers.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Island X=[-3.65,-2.60], Z=[-8.70,-6.45], Y=[0,0.91], 0.30 m knee space, and sink X=[-3.55,-3.05], Z=[-8.60,-8.10] remain unchanged; matching cuts require no parent revision.
@evidence spaces/rooms/common.md#common-island-reservation Reserved outline, knee space, and sink X/Z supply the 0.50×0.50 m cut; faucet top 1.26 m remains below the 1.31 m cap.
-->

Building classification: fixture. The sink/dishwasher island has fixed placement within its floor reservation.

Adopt reference 03's pale top, island sink, and guest-side knee space. Actual width and length come from the common-area reservation.

The [island reservation](../spaces/rooms/common.md#common-island-reservation) supplies X=[-3.65,-2.60], Z=[-8.70,-6.45], Y=[0,0.91], giving length 2.25 m, width 1.05 m, height 0.91 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with the rear edge at the seating outline and +Z facing the work side. Placement yaw -π/2 maps local +Z to world -X and +X to world +Z, so the world -Z rear end is local -X. Part positions below use distances from that rear end and work face to preserve orientation.

The whole 2.25×1.05 m top occupies Y=[0.88,0.91]. Work-side storage takes 0.75 m, divided into 0.71 m `carcass`, 0.02 m fronts, and 0.02 m handles. Leave the seating-side 0.30 m as [reserved knee space](../spaces/rooms/common.md#common-island-reservation). The body has a 0.10 m `plinth`. The 0.50×0.50 m sink cut starts 0.10 m from the rear end and work face, matching [sink X=[-3.55,-3.05], Z=[-8.60,-8.10]](../spaces/rooms/common.md#common-island-reservation). Its bowl is an open box extending 0.20 m below the cut. A column at the cut's rear-edge centre joins a spout bent toward the work face, with height 0.35 m above the top below the 1.31 m cap. The dishwasher void extends 0.65–1.25 m from the rear end, 0.60 m inward from the work face, and Y=[0,0.88]; the [dishwasher prototype](#kitchen-dishwasher) fills it.

Boundaries are `plinth`, `carcass`, `leaf`, `drawer-front`, `handle`, `countertop`, `basin`, and `faucet`. Work-side fronts/handles are rigid and follow the [base-run](#kitchen-base-run) division/projection rules. There are no end columns or walls. Sink drain, individual faucet controls, and countertop-edge molding are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. Observe full-length 0.30 m knee clearance from the seating side, 0.05 m separation between sink cut and dishwasher bay in plan, and faucet top no higher than 1.26 m. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`countertop` is a 2.25×1.05×0.03 m member at Y=[0.88,0.91], with the reserved 0.50×0.50 m hole removed. `basin` is a 0.20 m deep open box with 0.012 m sides and bottom, whose upper exterior meets the top's cut faces. `faucet` uses a 0.025 m diameter column at world X=−3.02 m, 0.03 m behind sink rear X=−3.05 m, and centre Z=−8.35 m, over Y=[0.91,1.26]. At 1.26 m, a 0.018 m diameter spout extends 0.20 m toward world −X. `carcass` occupies depth 0.71 m and Y=[0.10,0.88], from a front recessed 0.04 m from the work face to the knee-space start. Remove both the 0.60×0.60×0.88 m dishwasher bay and bowl bay X=[−3.55,−3.05], Z=[−8.60,−8.10], Y=[0.71,0.88]. Bowl exterior meets those boundaries by face rather than overlapping the closed body. `plinth` occupies the body's Y=[0,0.10] foot with a 0.07 m front recess and stays outside knee space. Apply [base-run](#kitchen-base-run) bay widths, leaf Y=[0.10,0.73], drawer Y=[0.73,0.88], 0.02 m fronts, and 0.02 m handles to remaining storage lengths after excluding the dishwasher bay. Depth 0.71+0.02+0.02=0.75 m simultaneously preserves the work-face outline and seating-side 0.30 m knee space.

## Island dishwasher {#kitchen-dishwasher}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns dishwasher bounds, body/leaf/controls/handle, door pivot, five boundaries, limits, and two observations.
@evidence principles/core/common.md#substantive-completion It fixes 0.60×0.60×0.88 m, 0.60 m leaf Y=[0.10,0.70], controls Y=[0.70,0.88], and a flush recessed upper-leaf handle.
@evidence principles/core/common.md#declared-basis Reserved Z=[-8.05,-7.45] and 0.60 m depth supply the body; the island underside supplies 0.88 m height, while controls are authored to match leaf height to operating width.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The bay gains a lower-edge horizontal hinge, controls keeping leaf height within 0.60 m operation, and a nonprojecting recessed handle.
@evidence principles/design/models.md#representation-contract Body/leaf/controls/handle hierarchy uses appliance-body, leaf, control-panel, handle, and appliance-interior; racks, spray arms, and drainage are omitted.
@evidence principles/design/models.md#spatial-convention Local +Z front faces world -X after placement; the lower-edge horizontal door pivot opens toward +Z by at most 90°.
@evidence principles/design/models.md#reviewable-structure Review exposes closed alignment with the island work face, open-leaf end X=-4.25 m, and Z separation from oven operation.
@evidence principles/design/models.md#model-observable-style-basis Reference 03 does not clearly separate the dishwasher leaf; flush work-face placement, a recessed handle, and fixed upper controls are authored observable decisions rather than a style label.
@evidence principles/design/models.md#model-scale-layer-completion Island-defined 0.88 m scale, four parts, door interface, five boundaries, interior limits, and two observations cover the layers.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved Z=[-8.05,-7.45], 0.60 m body depth, and operating X=[-4.25,-3.65] remain unchanged; matching 0.60 m leaf height requires no parent revision.
@evidence spaces/rooms/common.md#common-island-reservation Reserved Z/depth supply bounds; a 0.60 m leaf at 90° matches the 0.60 m operating width X=[-4.25,-3.65].
@evidence obligations/design/models.md#articulation-ownership door is a stable lower-edge horizontal hinge opening toward +Z by at most 90°; controls stay fixed at Y=[0.70,0.88] and the handle is recessed into the leaf top.
-->

Reference 03 does not clearly separate the dishwasher leaf. Settings equipment requirements and the island bay determine the prototype without measuring leaf width from the photograph.

The [dishwasher reservation](../spaces/rooms/common.md#common-island-reservation) supplies Z=[-8.05,-7.45] and body depth 0.60 m, giving width/depth 0.60 m and height 0.88 m from the island-top underside. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z front facing world -X after placement.

Parts are body, leaf, controls, and handle. The leaf occupies Y=[0.10,0.70] and opens down toward +Z by at most 90° on lower-edge horizontal pivot `door`. Its 0.60 m height exactly matches [operating X=[-4.25,-3.65]](../spaces/rooms/common.md#common-island-reservation), so the upper-leaf handle is flush and recessed. Controls remain fixed at Y=[0.70,0.88], a layer-authored division fitting leaf height to reserved operation.

Boundaries are `appliance-body`, `leaf`, `control-panel`, `handle`, and `appliance-interior`. Racks, spray arms, and drainage are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. Observe closed work-face alignment and, at 90°, leaf end X=-4.25 m and Z separation from oven operation. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`appliance-body` has closed bounds 0.60×0.60×0.88 m with the front-leaf space empty. `leaf` is 0.60×0.60×0.02 m at Y=[0.10,0.70], Z=[0.58,0.60]; `control-panel` is the immediately upper 0.60 m wide, 0.02 m thick band at Y=[0.70,0.88], Z=[0.58,0.60]. `handle` is a 0.12 m wide, 0.012 m deep recess centred on the upper leaf edge without front projection. Behind the open leaf, `appliance-interior` is an empty box of width X=0.56 m, height Y=0.56 m and depth Z=0.50 m at X=[−0.28,0.28], Y=[0.12,0.68], Z=[0.08,0.58]. Remove that volume from the body and fit 0.02 m side/top/bottom/rear linings at the boundaries; front Z=0.58 m is an actual opening. Leaf and linings touch only by face.

## Island stool {#kitchen-island-stool}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the repeated three-seat stool prototype's seat, four legs, footrest, backrest omission, boundaries, and observations; instances owns three placements.
@evidence principles/core/common.md#substantive-completion It fixes seat top 0.64 m, 0.40×0.40 m seat with 0.05 m thickness, 0.44×0.44 m leg spread with 0.03 m square members, and footrest height 0.25 m.
@evidence principles/core/common.md#declared-basis The room document supplies seat height; this layer chooses seat/spread dimensions inside 0.65 m use width, leaving at least 0.05 m to adjacent stools.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Three reservations gain a seat/four-leg/square-footrest structure, no backrest, and partial insertion below knee space.
@evidence principles/design/models.md#representation-contract Seat, legs, and footrest have seat/leg/footrest boundaries; sitting and insertion use placement changes without joints, while seat curvature, welds, and protective feet are omitted.
@evidence principles/design/models.md#spatial-convention The rear edge is the leg-spread rear, +Z faces the island (world -X at yaw -π/2), and occupancy is 0.44×0.44 m with height 0.64 m.
@evidence principles/design/models.md#reviewable-structure Side review exposes the 0.27 m difference between 0.64 m seat and 0.91 m top; plan gaps distinguish three stools from one long bench.
@evidence principles/design/models.md#model-observable-style-basis Reference 03's three independent high stools become backless square seats, slightly splayed 0.03 m legs, and 0.25 m square footrests; omitted backs preserve dining visibility.
@evidence principles/design/models.md#model-scale-layer-completion Seat/island comparative scale, three part groups, no joints, three boundaries, and two observations complete the stool representation.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Three seats, 0.64 m height, and 0.30 m knee space remain unchanged; 0.40 m seats and 0.44 m spreads fit 0.65 m use widths without parent revision.
@evidence spaces/rooms/common.md#common-island-reservation Three reserved seats and 0.64 m height use one prototype three times; backless stools slide partly below the 0.30 m knee space.
-->

Adopt reference 03's three independent high stools behind the island. Compare count and spacing against reserved seats.

One prototype serves [three island seats](../spaces/rooms/common.md#common-island-reservation), with instances owning placement. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) use the leg-spread rear as the rear edge and +Z toward the island, world -X at yaw -π/2. The room supplies seat top 0.64 m. This layer chooses 0.40×0.40 m seats and 0.44×0.44 m spreads within each 0.65 m use width, preserving at least 0.05 m to adjacent stools.

Parts are seat, four legs, and footrest ring. The seat is 0.05 m thick; 0.03 m square legs splay slightly from floor to seat underside, joined by a square ring at 0.25 m. No backrest blocks the dining view, and stools can sit partly beneath 0.30 m knee space. There are no joints; sitting and insertion are placement changes.

Boundaries are `seat`, `leg`, and `footrest`. Seat curvature, welds, and floor-protection caps are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. Side views compare seat 0.64 m with top 0.91 m for a 0.27 m difference; plans require visible gaps so three stools do not read as a long bench. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`seat` is a 0.40×0.40×0.05 m panel at X=[−0.20,0.20], Z=[0.02,0.42], Y=[0.59,0.64] m. Four 0.03×0.03 m `leg` members run linearly from floor centres X=±0.205, Z=0.015/0.425 m to seat-underside centres X=±0.16, Z=0.06/0.38 m, ending at Y=0.59. Outer foot corners X=±0.22 and Z=0/0.44 preserve the 0.44×0.44 m spread. `footrest` uses 0.02 m wide/high square bars at Y=[0.24,0.26]. Each end uses the leg centre linearly interpolated at that height, offset 0.015 m toward the leg's inner face, meeting it by face without overlapping volume.

## Six-seat dining table {#dining-table}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns table bounds, top/four aprons/four legs, seat-specific knee-space arithmetic, boundaries, and observations.
@evidence principles/core/common.md#substantive-completion It fixes a 1.70×0.90 m top at Y=[0.715,0.75] with 0.035 m thickness, 0.05×0.05 m legs, 0.08 m aprons recessed 0.02 m, and 0.635 m knee clearance.
@evidence principles/core/common.md#declared-basis Dining reservations supply top bounds and 0.75 m height; common-room supplies six seats, and the design compares occupant X=[-0.80,-0.20]/[0.20,0.80] with corner legs.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved bounds gain corner legs/aprons and arithmetic avoiding each seat's occupant width.
@evidence principles/design/models.md#representation-contract Top, four aprons, and four legs use top/apron/leg boundaries without joints, retaining knee space; grain direction, top chamfers, and connecting hardware are omitted.
@evidence principles/design/models.md#spatial-convention Four-sided use is a furniture-frame exception with origin at floor-plan centre and +X lengthwise; corner legs occupy X=[-0.85,-0.80]/[0.80,0.85], Z=[-0.45,-0.40]/[0.40,0.45] m.
@evidence principles/design/models.md#reviewable-structure Front/side orthographic views require corner-only legs, open knee spaces, and a readable 0.30 m top/seat difference.
@evidence principles/design/models.md#model-observable-style-basis Four square corner legs, 0.08 m aprons recessed 0.02 m, and a 0.035 m top are observable structure without a style label.
@evidence principles/design/models.md#model-scale-layer-completion The 0.75 m table/chair comparison, three part groups, no joints, three boundaries, knee arithmetic, and two observations cover the layers.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved top X=[-0.35,1.35], Z=[-8.40,-7.50], height 0.75 m, and six seats remain unchanged; legs avoid occupant widths without parent revision.
@evidence settings/10-house.md#common-room Six seats for family and guests govern leg/apron positions preserving seat-specific knee space.
@evidence spaces/rooms/common.md#common-dining-reservation Reserved top bounds give 1.70×0.90 m at 0.75 m; end-seat occupant width Z=[-0.30,0.30] remains between legs.
-->

Adopt reference 03's wooden table for six occupants. Decorative bowls belong to prop prototypes rather than table structure.

The [dining reservation](../spaces/rooms/common.md#common-dining-reservation) supplies top X=[-0.35,1.35], Z=[-8.40,-7.50], height 0.75 m, giving length 1.70 m and width 0.90 m. Four-sided use is an exception to [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame): origin at floor-plan centre, +X lengthwise. Parts preserve knee space for [six family/guest seats](../settings/10-house.md#common-room).

Parts are top, four aprons, and four legs. The top occupies Y=[0.715,0.75], thickness 0.035 m. Four 0.05×0.05 m legs align with its corners. Local top bounds are X=[-0.85,0.85], Z=[-0.45,0.45]. Long-side seat centres X=-0.50/+0.50 m each have ±0.30 m occupant widths X=[-0.80,-0.20]/[0.20,0.80], touching but not overlapping leg X=[-0.85,-0.80]/[0.80,0.85]. End-seat width Z=[-0.30,0.30] fits between leg Z=[-0.45,-0.40]/[0.40,0.45]. Aprons are 0.08 m high beneath the top, recessed 0.02 m from its edges, leaving knee clearance 0.635 m.

Boundaries are `top`, `apron`, and `leg`. There are no joints; grain direction, top-edge chamfers, and connecting hardware are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. Front/side orthographic views require only four corner legs and open seat-specific knee spaces, plus a readable 0.30 m difference between 0.75 m top and chair seat. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`top` is a 0.035 m panel at X=[−0.85,0.85], Z=[−0.45,0.45], Y=[0.715,0.75]. Four `leg` members use corner X=[−0.85,−0.80]/[0.80,0.85], Z=[−0.45,−0.40]/[0.40,0.45], rising over Y=[0,0.715] to the top underside. Four 0.02 m thick `apron` members occupy Y=[0.635,0.715]: long panels X=[−0.80,0.80], Z=[−0.43,−0.41]/[0.41,0.43], short panels Z=[−0.40,0.40], X=[−0.83,−0.81]/[0.81,0.83]. Aprons meet inner leg faces without entering leg/top volumes.

## Dining chair {#dining-chair}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the six-seat repeated chair prototype's bounds, seat/leg/back hierarchy, boundaries, and observations; instances owns placement under two repetition rules.
@evidence principles/core/common.md#substantive-completion It fixes 0.45×0.50 m bounds, back top 0.85 m, seat Y=[0.42,0.45], 0.035 m legs, back slats/bands over Y=[0.62,0.85] with 0.02 m depth, and 5° rear lean.
@evidence principles/core/common.md#declared-basis This layer chooses seat 0.45 m, 0.30 m below table height, and width 0.45 m for insertion within 0.65 m use width; dining reservations supply six seats.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Six reservations gain rear legs continuing as back posts, a 5° back, no arms, and a back top 0.10 m above the table.
@evidence principles/design/models.md#representation-contract Seat, four legs, two posts, slats, and bands use seat/leg/back boundaries; pulling out and sitting are placement changes without joints, while seat curvature, leg joints, and back curvature are omitted.
@evidence principles/design/models.md#spatial-convention Rear occupancy edge is Z=0 and +Z faces the table; rear-leg back face Z=0.05 m and post centre Z=0.0675 m differ, retaining 0.45 m width, 0.50 m depth, and 0.85 m back height.
@evidence principles/design/models.md#reviewable-structure Review exposes 0.45 m seat, 0.85 m back, lean, insertion between table legs, and six repetitions of the same prototype.
@evidence principles/design/models.md#model-observable-style-basis Reference 03 becomes an armless seat, posts continuing rear legs, four vertical slats, and 5° rear lean.
@evidence principles/design/models.md#model-scale-layer-completion Body dimensions compare the 0.30 m seat/table difference, four slats/five gaps filling 0.38 m, the 5° axis Y=0.42/Z=0.0675 m with 0.0124 m rear clearance, and three boundaries; actual member meshes/UVs remain unverified until source is implemented.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Six seats and 0.75 m table height remain unchanged; 0.45 m width fits 0.65 m use width without parent revision.
@evidence spaces/rooms/common.md#common-dining-reservation One prototype serves six seats; back top 0.85 m projects 0.10 m above the top and remains outside the table edge when inserted.
@evidence obligations/design/models.md#reference-scale Seat 0.45 m is 0.30 m below table 0.75 m and back 0.85 m is 0.10 m above; table-based chair dimensions are checked in side views.
@evidence obligations/design/models.md#model-representation-completion This final H2 supplies scale, hierarchy, no-joint state, seat/leg/back boundaries, and three observations; like the preceding nine H2s, unverified observations claim neither structural outputs nor semantic judgment.
-->

One chair prototype serves [six seats](../spaces/rooms/common.md#common-dining-reservation); instances owns placement under two repetition rules. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) put the rear occupancy edge at Z=0 and +Z toward the table. Bounds are width 0.45 m, depth 0.50 m, back top 0.85 m. This layer chooses seat 0.45 m for a posture 0.30 m below the 0.75 m table, and width 0.45 m to insert between legs within 0.65 m seat-use width.

Adopt reference 03's vertical-slat chair. Parts are seat, four legs continuing into two rear posts, two horizontal bands, and four vertical slats. The 0.03 m seat occupies Y=[0.42,0.45], Z=[0,0.50] m; legs/posts are 0.035 m square. Rear-leg back faces lie 0.05 m inside occupancy at Z=0.05; centres are Z=0.0675, with front-leg centres Z=0.4825. Clear width between rear posts is 0.45−2×0.035=0.38 m; four 0.035 m slats and five 0.048 m gaps fill it: 4×0.035+5×0.048=0.38 m. Lower band Y=[0.59,0.62], upper Y=[0.82,0.85], and slats Y=[0.62,0.82] all have 0.02 m depth. The 5° lean axis parallels local X through Y=0.42, Z=0.0675. Top displacement is (0.85−0.42)tan5°=0.0376 m; rear-post back faces retain 0.0675−0.0376−0.0175=0.0124 m inside the bounds. There are no arms. Back top 0.85 m rises 0.10 m above the table, staying outside its edge when inserted. There are no joints; pulling out for sitting changes placement.

Boundaries are `seat`, `leg`, and `back`. Seat curvature, leg joints, and back curvature are omitted. The source owner is `src/models/furnishings/kitchen-dining.ts`. Observe seat 0.45 m, back 0.85 m, and lean in side view; chair width within the 1.60 m inner table-leg gap in inserted plan view; and six repetitions reading as the same prototype. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`seat` is a closed panel at X=[−0.225,0.225], Z=[0,0.50], Y=[0.42,0.45]. Four 0.035×0.035 m `leg` members have X centres ±0.2075, rear Z=0.0675, front Z=0.4825, and rise from floor to Y=0.42. `back` consists of closed square members for two posts, two bands, and four slats: lower band Y=[0.59,0.62], upper Y=[0.82,0.85], slats Y=[0.62,0.82], leaning 5° from Y=0.42/Z=0.0675. The two rear leg/post members are continuous longitudinal pieces without additional overlapping cylinders.
