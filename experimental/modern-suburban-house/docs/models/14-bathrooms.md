# Fixture prototypes for the powder room and two bathrooms

## Shared toilet {#shared-toilet}

Building classification: fixture. Toilets in three rooms have fixed floor/wall water-supply and drainage positions.
<!--
@evidence principles/core/common.md#scope-preservation One shared toilet covers powder/shower/tub reservations with depth 0.75 m, height 0.82 m, width 0.50 m and seven parts; ceramic-shell thickness beyond the 0.02 m front rim, trap, and supply pipe are omitted.
@evidence principles/core/common.md#substantive-completion It fixes tank width 0.50/depth 0.20 m, Y=[0.40,0.78], tank lid [0.78,0.82], body width 0.38, 12-sided elliptical cavity 0.27×0.31×0.15 m, and seat-ring top 0.43 m.
@evidence principles/core/common.md#declared-basis This layer chooses 0.50 m width within the narrowest 0.65 m reservation for at least 0.075 m side margins; depth/height derive from all three reservations.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved depth 0.75 m, width 0.70/0.65 m, and seat 0.43 m gain tank/body/seat-lid parts and seat-lid pivot.
@evidence principles/design/models.md#representation-contract Tank, tank lid, foot, bowl body, seat, seat lid, and flush lever with a 12-sided elliptical cut use ceramic/toilet-seat/lid/handle; the proxy claims no trap or supply pipe.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces sitting; the body reaches 0.75 m from wall and seat-lid pivots at its rear horizontal hinge.
@evidence principles/design/models.md#reviewable-structure Fixed side views challenge seat 0.43/tank lid 0.82 m; three placement plans challenge front ends at use-reservation boundaries.
@evidence principles/design/models.md#model-observable-style-basis A 0.50 m tank/lid and 0.38 m rounded bowl define silhouette/proportions without style labels or material choices beyond ids.
@evidence principles/design/models.md#model-scale-layer-completion Seat scale, seven-part hierarchy, closed-rest seat-lid, omitted shell/plumbing detail, and two unverified observations determine blocking.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Three X/Z reservations and seat 0.43/maximum 0.82 m remain unchanged; all fit the 0.50 m prototype with clearance, identifying no parent defect.
@evidence spaces/rooms/powder.md#powder-fixture-use X=[4.75,5.50], Z=[-1.65,-0.95], front -X supply depth 0.75 m and width cap 0.70 m.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use X=[2.32,2.97], Z=[-8.80,-8.05], front +Z supply the narrowest 0.65 m width cap for the 0.50 m prototype.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use X=[4.75,5.50], Z=[-6.65,-5.95], front -X supply the same 0.75×0.70 m box as powder.
@evidence settings/10-house.md#powder Required toilet uses the shared prototype within powder depth 0.75/width 0.70 m.
@evidence settings/10-house.md#shower-bathroom This prototype supplies the toilet among shower, basin, and toilet, respecting +Z front and 0.65 m width.
@evidence settings/10-house.md#tub-bathroom This prototype supplies the toilet among tub, basin, and toilet, fitting its -X-front box.
@evidence obligations/design/models.md#addressable-model-decisions One H2 owns toilet bounds/parts/seat-lid/ids/observations; separate H2s own vanity, mirror, towel bar, shower, tub, and curtain rail.
@evidence obligations/design/models.md#model-review-set Fixed side and three-placement plan views permit revision comparisons independent of dramatic shot composition.
@evidence obligations/design/models.md#reference-scale Shared seat 0.43/maximum 0.82 m and width 0.50 within the narrowest 0.65 m reservation provide the same inspection scale across rooms.
@evidence obligations/design/models.md#articulation-ownership Only rear horizontal seat-lid remains a motion interface; absent reserved opening use makes its rest state closed.
-->

Adopt reference 02's upper sanitary ceramics and reference 05's shower-bath edge as the toilet family. Plumbing positions are not inferred from photographs.

One prototype supplies toilets required by [powder](../settings/10-house.md#powder), [shower bathroom](../settings/10-house.md#shower-bathroom), and [tub bathroom](../settings/10-house.md#tub-bathroom). [Powder](../spaces/rooms/powder.md#powder-fixture-use) X=[4.75,5.50], Z=[-1.65,-0.95] and [tub](../spaces/rooms/tub-bath.md#tub-fixture-use) X=[4.75,5.50], Z=[-6.65,-5.95] have front -X, depth 0.75 m, width 0.70 m. [Shower](../spaces/rooms/shower-bath.md#shower-fixture-use) X=[2.32,2.97], Z=[-8.80,-8.05] has front +Z, depth 0.75, width 0.65. All share seat 0.43/maximum height 0.82 m. Bounds are therefore depth 0.75, height 0.82, tank width 0.50 m; this layer chooses width to leave at least 0.075 m both sides of every reservation. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) use +Z sitting front, with shared conventions in [model-local frame](00-model-frame.md#model-local-frame).

Parts are tank, tank lid, foot, bowl body, seat, seat lid, and flush lever. Tank width 0.50/depth 0.20 m occupies Y=[0.40,0.78]; tank lid Y=[0.78,0.82] uses `ceramic`. `lid` means only the moving seat lid. The body has a 12-sided elliptical section from 0.28 to 0.75 m from wall. Floor foot is 0.24×0.35×0.20 m; ceramic body widens above it to 0.38 m and reaches Y=0.40. Bowl top is 0.38×0.45 m with a closed-bottom elliptical cut 0.27 m wide, 0.31 m deep, 0.15 m high. The 0.03 m seat ring tops at 0.43; closed seat lid adds 0.025 m. Hinges lie at the rear. `seat-lid` retains the rear horizontal interface but rests closed because rooms reserve no opening use. [Partition ids](00-model-frame.md#model-surface-partition-naming) are `ceramic`, `toilet-seat`, `lid`, and `handle`.

Origin is the tank-rear floor centre, +Z sitting direction. Tank Z=[0,0.20], ceramic foot [0.28,0.63], bowl [0.28,0.73]; a 0.02 m ceramic front rim reaches 0.75. Seat ring/lid each use 0.38×0.45 m plans with rear pivot Z=0.28. Tank lid is 0.50×0.20×0.04 m. The 0.08×0.015×0.015 m flush bar centres at front-left X=-0.18/Y=0.68, ending Z=0.215.

Other shell thickness, trap, and supply pipe are omitted. The source owner is `src/models/furnishings/sanitary-fittings.ts`. Fixed [model-review](00-model-frame.md#model-review-set) sides require seat 0.43 and tank lid 0.82; three plans require front ends at reservation boundaries. All observations remain unverified.

`toilet-seat` is an outer 0.38×0.45 m ellipse centred Z=0.515 at Y=[0.40,0.43], with inner 0.27×0.31 removed. `lid` closes the same outer ellipse at Y=[0.43,0.455], rear hinge Z=0.28. `handle` occupies X=[−0.22,−0.14], Y=[0.6725,0.6875], Z=[0.20,0.215], meeting tank front Z=0.20.

## Vanity and basin {#vanity-basin}
<!--
@evidence principles/core/common.md#scope-preservation One W/D vanity covers three rooms plus three shower-only accessories, omitting plumbing/drainage.
@evidence principles/core/common.md#substantive-completion It fixes top 0.85 m, plinth 0.10 m, top thickness 0.03 m, a W−0.20 by D−0.20 elliptical cut with 0.15 m bowl, and faucet 0.20 m above the top.
@evidence principles/core/common.md#declared-basis Room X/Z supply W/D=0.60/0.45, 0.70/0.55, 0.85/0.55 m; a rear 0.12 m prop strip preserves bowl/faucet visibility.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Plans/top height gain plinth/storage/front/top/inset bowl/faucet divisions and optional shower-only props.
@evidence principles/design/models.md#representation-contract Six parts and three optional props with an open bowl use plinth/carcass/leaf/handle/countertop/ceramic/faucet/accessory; recessed-handle leaves are rigid.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces users; bowl centres the top, faucet sits behind it, and props occupy the rear 0.12 m.
@evidence principles/design/models.md#reviewable-structure Review challenges shower props behind bowl/faucet, three parameter-pair bounds matching reservations, and readable side height 0.85 m.
@evidence principles/design/models.md#model-observable-style-basis Recessed fronts, elliptical inset bowl, and 0.03 m top define construction without color/finish choices beyond ids.
@evidence principles/design/models.md#model-scale-layer-completion Shared height, three W/D pairs, panel/leaf counts/gaps, 16-segment bowl profiles, faucet contact, and three prop positions fix design; plumbing/drainage are excluded and actual meshes/frames unverified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Three X/Z/front directions (-Z/-X/-X) become W/D unchanged, retaining shower-accessory requirements without parent defects.
@evidence spaces/rooms/powder.md#powder-fixture-use X=[3.65,4.25], Z=[-0.70,-0.25] supplies W=0.60/D=0.45 m and front -Z.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use X=[2.52,3.07], Z=[-6.80,-6.10] supplies W=0.70/D=0.55 m and front -X.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use X=[4.95,5.50], Z=[-5.75,-4.90] supplies widest W=0.85/D=0.55 m and front -X.
@evidence settings/10-house.md#shower-bathroom Shower-only options are a 0.12×0.08×0.02 m soap dish, 0.07 m diameter/0.18 m pump bottle, and 0.07 m diameter/0.10 m cup.
@evidence settings/10-house.md#powder Required handwashing uses W=0.60/D=0.45 m.
@evidence settings/10-house.md#tub-bathroom Required basin uses W=0.85/D=0.55 m, leaving grey-brown appearance to carcass/leaf material binding.
-->

Building classification: fixture. Fixed vanities fit bathroom wall/floor reservations.

Adopt reference 02's vanity and reference 05's wash area beyond the shower-bath door. Reservations supply room-specific widths.

One W/D prototype has top 0.85 m. [Powder](../spaces/rooms/powder.md#powder-fixture-use) X=[3.65,4.25], Z=[-0.70,-0.25] supplies W=0.60/D=0.45, front -Z. [Shower](../spaces/rooms/shower-bath.md#shower-fixture-use) X=[2.52,3.07], Z=[-6.80,-6.10] supplies W=0.70/D=0.55; [tub](../spaces/rooms/tub-bath.md#tub-fixture-use) X=[4.95,5.50], Z=[-5.75,-4.90] supplies W=0.85/D=0.55 m, both front -X. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) use +Z user front.

Parts are 0.10 m plinth, storage body, leaves, 0.03 m top, inset bowl, and faucet. Origin is rear-wall floor centre with X=[−W/2,W/2], Z=[0,D]. Closed plinth occupies X=[−W/2+0.02,W/2−0.02], Z=[0,D−0.07], Y=[0,0.10]. Body Y=[0.10,0.82] uses 0.02 m sides/back/bottom, leaving front/top for leaves/top. Top covers W×D at Y=[0.82,0.85]. Its central W−0.20 by D−0.20 elliptical cut receives a 0.15 m open bowl. Sixteen perimeter vertices use upper radii ((W−0.20)/2,(D−0.20)/2) and bottom radii 0.70 times those; a 0.01 m bottom closes Y=[0.69,0.70]. Hole perimeter and bowl top meet once. Faucet base diameter 0.05/thickness 0.008 m contacts rear-top X=0/Z=0.05. A 0.025 m stem rises 0.20 m from the plate and a 0.018 m outlet extends 0.10 m toward the bowl, with outlet height 0.20 m above the top. Powder has one 0.56 m leaf; shower/tub have two leaves of 0.32/0.395 m each, with 0.02 m side/central gaps: 0.70=2×0.32+3×0.02 and 0.85=2×0.395+3×0.02. Leaves occupy Y=[0.10,0.82], thickness 0.02, with upper-edge recess depth 0.012/height 0.018 m, rigid without projection. Ids are `plinth`, `carcass`, `leaf`, `countertop`, `ceramic`, `faucet`, and recessed `handle`.

`carcass` unions side X=[−W/2,−W/2+0.02]/[W/2−0.02,W/2], Z=[0.02,D−0.02], Y=[0.12,0.82], back full-X Z=[0,0.02], Y=[0.10,0.82], and inner-X bottom Z=[0.02,D−0.02], Y=[0.10,0.12], retaining central bowl void. Front `leaf` Z=[D−0.02,D], Y=[0.10,0.82] uses powder X=[−0.28,0.28], shower [−0.33,−0.01]/[0.01,0.33], tub [−0.405,−0.01]/[0.01,0.405]. `countertop` removes the full-depth central ellipse through its 0.03 m thickness. `ceramic` contains open-bowl inner/outer walls tapering from the hole edge Y=0.82 to bottom Y=[0.69,0.70], occupying only the central void. `faucet` contains the top-contacting disk at Y=0.85, stem and +Z outlet. Each 0.12 m wide `handle` recess removes leaf Y=[0.802,0.82], Z=[D−0.012,D], with bottom/reveals and no separate positive volume.

Where painted walls contact `plinth`, remove rear Z=[0,0.015], Y=[0,0.10] and, for wall-contacting sides, the corresponding 0.015 m X-end strip at that height. Remove their union once. Top/bowl bounds remain fixed; tiled walls have no baseboard input and receive no recess.

[Shower settings](../settings/10-house.md#shower-bathroom) enable three optional props only there, in rear Z=[0,0.12]: soap dish 0.12×0.08×0.02, pump bottle diameter 0.07/height 0.18, cup diameter 0.07/height 0.10 m. Top contact (X,Z) positions are (−0.25,0.05), (0.18,0.065), (0.28,0.065). Ends fit X=[−0.35,0.35] and rear strip, separate from X=0 faucet plate, without crossing bowl-cut start Z=0.10. They use `accessory`. Plumbing/drainage are omitted. The source owner is `src/models/furnishings/bathrooms.ts`. Observe props behind bowl/faucet, three plan bounds matching reservations, and side height 0.85 m. All observations remain unverified.

## Wall mirror {#wall-mirror}

Building classification: fixture. Mirrors attach to walls above vanities.
<!--
@evidence principles/core/common.md#scope-preservation One width-W mirror covers three rooms; materials/rendering own actual reflection.
@evidence principles/core/common.md#substantive-completion It fixes height 0.80, projection 0.04, frame width 0.02/depth 0.04, and a 0.01 m panel recessed 0.03 m from the frame front.
@evidence principles/core/common.md#declared-basis Reserved widths 0.60/0.70/0.85 m and height range 1.10–1.90 m supply W and 0.80 m height through linked owners.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved boxes gain frame/recessed-panel construction and a lower-centre origin.
@evidence principles/design/models.md#representation-contract Frame/panel use mirror-frame/mirror; the prototype supplies a plane without reflection, rear fasteners, or chamfers.
@evidence principles/design/models.md#spatial-convention Wall mounting is a furniture-frame exception with lower-centre wall origin at 1.10 m.
@evidence principles/design/models.md#reviewable-structure Side projection at most 0.04 m and front bottom 0.25 m above vanity challenge the mirror.
@evidence principles/design/models.md#model-observable-style-basis Reference 02's rectangular vanity mirror becomes a 0.02 m frame and 0.03 m recessed panel without a style label; materials/rendering own reflection appearance.
@evidence principles/design/models.md#model-scale-layer-completion Projection/height, two parts, omitted reflection, and two unverified observations determine blocking.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Three mirror X/Z and heights 1.10–1.90 remain unchanged; 0.04 m projection equals reserved thickness without parent revision.
@evidence spaces/rooms/powder.md#powder-fixture-use X=[3.65,4.25], Z=[-0.29,-0.25], height 1.10–1.90 supplies W=0.60 m.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use X=[5.46,5.50], Z=[-5.75,-4.90], height 1.10–1.90 above upper floor supplies W=0.85 m.
@evidence settings/10-house.md#powder Required mirror uses W=0.60 m.
@evidence settings/10-house.md#tub-bathroom The mirror function marker uses W=0.85 m.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use Right-wall X=[3.03,3.07], Z=[-6.80,-6.10], height 1.10–1.90 above upper floor supplies W=0.70 m/projection 0.04 m.
@evidence settings/10-house.md#shower-bathroom Required mirror uses W=0.70 m, matching vanity width.
-->

Adopt reference 02's rectangular mirror above the vanity. Reflected scenes are not pasted onto mirror textures.

One width-W prototype has height 0.80/projection 0.04 m. [Powder](../spaces/rooms/powder.md#powder-fixture-use) X=[3.65,4.25], Z=[-0.29,-0.25], height 1.10–1.90 supplies W=0.60; [tub](../spaces/rooms/tub-bath.md#tub-fixture-use) X=[5.46,5.50], Z=[-5.75,-4.90], upper-floor height 1.10–1.90 supplies W=0.85; [shower](../spaces/rooms/shower-bath.md#shower-fixture-use) X=[3.03,3.07], Z=[-6.80,-6.10], same heights supplies W=0.70 m, matching its vanity. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) use the wall-mounted lower-centre origin at 1.10 m.

Parts are a 0.02 m wide/0.04 m deep frame and a 0.01 m panel recessed 0.03 m from its front. Ids are `mirror-frame`/`mirror`. Materials/rendering own actual reflection; the prototype supplies only a plane. Rear fasteners and chamfers are omitted. The source owner is `src/models/furnishings/sanitary-fittings.ts`. Observe side projection within 0.04 m and front bottom 0.25 m above the vanity. All observations remain unverified.

Frame sides occupy X=[−W/2,−W/2+0.02]/[W/2−0.02,W/2], Y=[0,0.80], Z=[0,0.04]; bottom/top span inner X and Y=[0,0.02]/[0.78,0.80]. `mirror` closes inner X, Y=[0.02,0.78], Z=[0,0.01], putting its front 0.03 m behind frame front 0.04. Edges meet frame inner faces without shared volume.

## Towel bar and towel {#towel-bar}

Building classification: fixture. Wall supports/bar belong to the building stage; the towel belongs to the subsequent individual-object stage.
<!--
@evidence principles/core/common.md#scope-preservation One W/H towel-bar and hanging-towel prototype covers three placements without textile folds.
@evidence principles/core/common.md#substantive-completion It fixes rod diameter 0.02 m/front 0.05 m from wall, towel front 0.08 m, rod 0.03 m below reservation top, and folded panels covering 70% of width down to the lower bound with total 0.03 m thickness.
@evidence principles/core/common.md#declared-basis Reserved width/height pairs 0.50/0.30, 0.25/0.40, 0.75/0.40 m keep the entire towel within 0.08 m projection.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved boxes gain two wall supports, a horizontal rod, and front/rear folded towel panels.
@evidence principles/design/models.md#representation-contract Supports/rod/towel use bracket/rod/towel; the proxy claims no folds.
@evidence principles/design/models.md#spatial-convention Wall-mounted origin is the reservation's lower wall-centre; rod front is 0.05 m, towel front 0.08 m, and rod lies 0.03 m below the upper bound.
@evidence principles/design/models.md#reviewable-structure Side views challenge towel front within 0.08 m of wall.
@evidence principles/design/models.md#model-observable-style-basis A 0.02 m rod and two folded panels with total 0.03 m thickness define simple silhouette/abstraction without a label.
@evidence principles/design/models.md#model-scale-layer-completion Projection cap, W/H, support/rod/towel hierarchy, omitted folds, and one side observation determine blocking.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Powder X=[4.40,4.90]/height 1.20–1.50, shower X=[2.20,2.45]/height 1.10–1.50, and tub Z=[-6.85,-6.10]/height 1.10–1.50 become W/H unchanged, with no parent defect.
@evidence spaces/rooms/powder.md#powder-fixture-use X=[4.40,4.90], height 1.20–1.50 supplies W=0.50/H=0.30 m.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use X=[2.20,2.45], upper-floor height 1.10–1.50 supplies W=0.25/H=0.40 m.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use Z=[-6.85,-6.10], upper-floor height 1.10–1.50 supplies W=0.75/H=0.40 m.
@evidence settings/10-house.md#powder Required towel becomes a folded-on-bar W=0.50/H=0.30 m placement.
@evidence settings/10-house.md#shower-bathroom Required towel uses the narrowest W=0.25/H=0.40 m bar.
@evidence settings/10-house.md#tub-bathroom The towel function marker becomes front/rear panels on a W=0.75 m rod.
-->

Adopt references 02/05's bathroom textiles as hanging towels. Prototype geometry omits folds and patterns.

One W/H prototype keeps towel-inclusive projection within 0.08 m. [Powder](../spaces/rooms/powder.md#powder-fixture-use) X=[4.40,4.90], height 1.20–1.50 supplies W=0.50/H=0.30; [shower](../spaces/rooms/shower-bath.md#shower-fixture-use) X=[2.20,2.45], upper-floor height 1.10–1.50 supplies W=0.25/H=0.40; [tub](../spaces/rooms/tub-bath.md#tub-fixture-use) Z=[-6.85,-6.10], same heights supplies W=0.75/H=0.40 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) use the wall-mounted reservation-bottom centre as origin.

Parts are two wall supports, horizontal rod, and towel. `rod` has diameter 0.02 m and centre 0.04 m from wall, front 0.05 m, sitting 0.03 m below the upper bound. Projection 0.08 m reaches the front towel face: rod front 0.05 plus total folded thickness 0.03. `bracket` consists of two 0.03 m disks and short arms. Front/rear towel panels cover 70% of rod width down to the lower bound, with total folded thickness 0.03 m. Ids are `rod`, `bracket`, and `towel`; folds are omitted. The source owner is `src/models/furnishings/sanitary-fittings.ts`. Side views require towel front within 0.08 m. All observations remain unverified.

Support disks are 0.006 m thick, centred 0.015 m inward from rod ends. Each 0.012 m diameter/0.024 m arm follows the wall normal from disk front 0.006 to rod rear 0.030, meeting its face. At W=0.25, towel-end margins 0.15W=0.0375 m are 0.0075 m farther inward than disk inner ends 0.030, avoiding support/towel overlap and preserving the 0.08 m cap.

Rod axis X=[−W/2,W/2], Y=H−0.03, Z=0.04 with diameter 0.02 gives front Z=0.05. Towel width is 0.70W over Y=[0,H−0.03], retaining front Z=0.08 and total 0.03 m thickness. Subsequent object source fits actual textile weave/thickness/placement to the rod surface without recreating the rod.

## Sliding glass shower booth {#sliding-shower-booth}
<!--
@evidence principles/core/common.md#scope-preservation Within 1.25×1.10×2.10 m, this prototype creates only front/right faces; room walls own the other two, and water, condensation, and seals are omitted.
@evidence principles/core/common.md#substantive-completion It fixes 0.008 m right glass, three 0.43 m front panels with 0.02 m overlaps, three 0.03 m tracks within front 0.09 m, and faucet/head heights 1.05/2.03 m above upper floor.
@evidence principles/core/common.md#declared-basis Left passage 1.25−0.43−0.02=0.80 m matches the room's at-least-0.80 m requirement.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds/passage gain three sliding panels/tracks stacking at the right end.
@evidence principles/design/models.md#representation-contract Tray/right glass/top-bottom tracks/three sliding panels/handle/faucet/head use shower-tray/glass/rail/handle/faucet, leaving two faces with room walls.
@evidence principles/design/models.md#spatial-convention World-origin X=1.525 and local +X=world +X transform rear-wall faucet X=[1.00,1.30] into local [-0.525,-0.225], centre -0.375 m; panels slide +X and tracks stay inside bounds.
@evidence principles/design/models.md#reviewable-structure Closed/max-open oblique views require in-bound panel motion; open plans require left passage 0.80 m.
@evidence principles/design/models.md#model-observable-style-basis Three overlapping glass fronts and a vertical handle on the leftmost panel define construction; materials binds black handle finish.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, 0.43 m panels, three pivots, water/condensation/seal omissions, and two-state observations determine blocking.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Room bounds/2.10 m height/passage and rear faucet X=[1.00,1.30] were compared; subtracting origin 1.525 gives local [-0.525,-0.225]/centre -0.375 while preserving 0.80 m passage without parent defects.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use Reserved 1.25×1.10×2.10 m supplies bounds, world faucet X transforms into local coordinates, and passage at least 0.80 m defines maximum opening.
@evidence settings/10-house.md#shower-bathroom Glass booth/doors and black metal handle become three sliding panes and vertical bar, leaving black finish to materials.
@evidence obligations/design/models.md#representation-ceiling Water, condensation, and seals are omitted and materials owns handle finish; glass geometry supports no water or waterproof-seal claims.
@evidence obligations/design/models.md#articulation-ownership panel-1/panel-2/panel-3 slide +X to a single-panel-width right stack; right glass remains fixed.
-->

Building classification: fixture. The fixed booth fits shower-room floor/walls.

Adopt reference 02's upper glazed booth. Reference 05 shows only part of the interior and does not determine panel counts.

The [shower reservation](../spaces/rooms/shower-bath.md#shower-fixture-use) supplies X=[0.90,2.15], Z=[-8.80,-7.70], upper-floor height 2.10 m, giving width 1.25/depth 1.10/height 2.10. Left/rear room walls form two faces; the prototype creates only front/right. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) at yaw 0 map +Z/+X to their world axes.

Parts are tray, right fixed glass, top/bottom tracks, three sliding panes, handle, and faucet/head. Tray thickness/top height is 0.018 m; a 0.010 m perimeter borders four interior planes sloping down 0.004 m toward the drain. Right glass X=[0.617,0.625] is 0.008 m thick, world Z=[−8.80,−7.79], Y=[0.018,2.10]. It stops at front-track rear Z=−7.79, sharing only that face rather than occupying the front-strip Z≥−7.79. Three 0.43 m front panes overlap horizontally 0.02 each: 3×0.43−2×0.02=1.25. `panel-1`/`panel-2`/`panel-3` slide +X into a 0.43 m right stack, leaving 1.25−0.43−0.02=0.80 m after the wall profile, matching [room passage](../spaces/rooms/shower-bath.md#shower-fixture-use). Three 0.03 m tracks fit front-inner 0.09 m. The leftmost pane has a vertical handle. Rear [faucet reservation](../spaces/rooms/shower-bath.md#shower-fixture-use) world X=[1.00,1.30] minus origin X=(0.90+2.15)/2=1.525 gives local [-0.525,-0.225], centre -0.375, world centre 1.15 m. Faucet/head heights are 1.05/2.03 above upper floor. Tracks are closed 0.03 m deep/0.025 m high rectangular sections in successive front depths. Panes are 0.008 m thick, height 2.10−0.018−2×0.025=2.032 m. The leftmost pane's 0.018 m diameter/0.20 m vertical handle sits 0.04 m inward from its free end, centre Y=1.00, projecting inward only 0.025 m. Faucet has a 0.08 m diameter/0.025 m deep disk and 0.025 m diameter/0.075 m outlet; a 0.025 m pipe extends 0.175 m from wall to a 0.14 m diameter/0.025 m head. Total faucet/head projections stay within parent 0.10/0.20 m.

Ids are `shower-tray`, `glass`, `rail`, `handle`, and `faucet`; materials binds black handle finish. Water, condensation, and seals are omitted. The source owner is `src/models/furnishings/bathrooms.ts`. Observe in-bound pane motion in closed/max-open oblique views and left passage 0.80 m in open plan. All observations remain unverified.

`shower-tray` is a closed 1.25×1.10×0.018 m member with 0.010 m perimeter and four interior planes lowered 0.004 m toward the centre drain. Rear `faucet` at local X=−0.375/Y=1.05 contains the disk/outlet above; at Y=2.03 it has a 0.025 m diameter/0.175 m pipe and 0.14 m diameter/0.025 m head. Finished bounds stay within booth/wall reservations.

Left `rail` profile occupies local X=[−0.625,−0.605], world Z=[−7.790,−7.760], Y=[0.018,2.10] above upper floor. The rearmost pane starts at X=−0.625 and Z=[−7.760,−7.752], meeting profile front only by face. Other panes use their own depths; their X union spans [-0.625,0.625]. The 0.020 m profile subtracts only from open effective passage, leaving 0.80 m. Top/bottom junctions end at face contact without overlapping covers.

Fixed right `glass` retains X=[0.617,0.625], world Z=[−8.80,−7.79], Y=[0.018,2.10]. Closed front panes occupy X=[−0.625,−0.195]/[−0.215,0.215]/[0.195,0.625], world Z=[−7.760,−7.752]/[−7.740,−7.732]/[−7.720,−7.712], Y=[0.043,2.075], with horizontal overlap only at different depths. Left-pane `handle` centre X=−0.235/Y=1.00 has length 0.20/diameter 0.018; a 0.008 m support joins Z=[−7.767,−7.760] to rod surface Z=−7.767. Innermost Z=−7.785 gives 0.025 m projection from the pane.

## Bathtub with shower {#bathtub}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns shell, apron, rim, interior, faucet, shower column, and head within the tub reservation, excluding water/drainage.
@evidence principles/core/common.md#substantive-completion It fixes 1.80×0.80×0.55 m, rim 0.06 m, bottom 0.15 m, inner-corner radius 0.08 m, apron 0.03 m, and faucet/column/head sections and positions.
@evidence principles/core/common.md#declared-basis Reserved X=[4.70,5.50], Z=[-8.70,-6.90], rim 0.55 m supply bounds; yaw -π/2 maps world -Z rear to local -X faucet end.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain apron +Z, yaw -π/2, and rounded interior corners.
@evidence principles/design/models.md#representation-contract Seven layers use ceramic/faucet, excluding water/drainage.
@evidence principles/design/models.md#spatial-convention Yaw -π/2 maps +Z to world -X and +X to world +Z, so the rear faucet end is local -X.
@evidence principles/design/models.md#reviewable-structure Side rim 0.55 m and front-view rear-end faucet challenge the tub.
@evidence principles/design/models.md#model-observable-style-basis Reference 02's white tub becomes apron, 0.06 m rim, and rounded interior; ceramic retains finish ownership.
@evidence principles/design/models.md#model-scale-layer-completion Wall thicknesses/corner radius, faucet/column/head sections/positions, water/drainage omissions, and two unverified observations close authored dimensions.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved X/Z/rim remain unchanged; this H2 requires no room-value revision.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use Reserved X/Z and rim 0.55 above upper floor supply width 0.80/length 1.80/height 0.55 m.
@evidence settings/10-house.md#tub-bathroom Required tub/shower becomes 0.06 m rim, rear faucet, and column/head rising to 1.90 m.
-->

Building classification: fixture. The fixed tub fits bathroom floor/wall reservations.

Adopt reference 02's white tub in its separate bathroom. Bright photographic surfaces establish neither water nor operating drainage.

The [reservation](../spaces/rooms/tub-bath.md#tub-fixture-use) supplies X=[4.70,5.50], Z=[-8.70,-6.90], rim 0.55 m above upper floor, giving width 0.80/length 1.80/height 0.55 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) use +Z apron front. Yaw -π/2 maps +Z to world -X and +X to world +Z, making world -Z rear the local -X faucet end.

Seven layers are shell, apron, rim, interior void, faucet, shower column, and head. Local X=[-0.90,0.90] is length, Z=[0,0.80] rear-to-front, Y=[0,0.55]. The inner hole X=[-0.84,0.84], Z=[0.06,0.74] closes at Y=0.15, leaving 0.15 m bottom. Four 0.08 m radius inner plan corners use eight equal-angle intervals per quadrant, tangent to straight runs. Rim width is 0.06 all around, thickness 0.03 at Y=[0.52,0.55]. Apron is a closed 0.03 m panel at Z=[0.77,0.80], meeting the shell at one boundary. Solid side/rear/front water-holding walls remain between hole and outer bounds; all exposed rim/interior/apron faces use `ceramic`.

`ceramic` covers inner/outer/bottom/rim/apron faces remaining after the rounded hole is removed down to Y=0.15. Apron attaches only where the rear shell ends at Z=0.77.

Faucet disk diameter 0.08/thickness 0.02 centres at rear local X=-0.87, Z=0.40, Y=0.70, 0.15 m above rim. A same-axis 0.025 m vertical support runs from rim Y=0.55 to disk underside 0.69 without floating gap. A 0.025 m outlet runs 0.12 m toward +X to X=-0.75. The 0.025 m column at X=-0.87 rises Y=0.70–1.875; a same-diameter 0.18 m +X arm supports a 0.14 m diameter/0.025 m head, top 1.90/bottom 1.875. All closed support/disk/pipe/column/arm/head faces use `faucet`. Water, drainage, and internal supply pipes are omitted.

Faucet components stay in axis X=−0.87/Z=0.40, Y=[0.55,1.90]; outlet X=[−0.87,−0.75], Y=0.70 and head arm X=[−0.87,−0.69], Y=1.875 remain within length X=[−0.90,0.90], including 0.025 m pipes and 0.14 m head.

The source owner is `src/models/furnishings/bathrooms.ts`. Observe side rim height 0.55 m and rear-end faucet from the front. All observations remain unverified.

## Tub curtain rail and curtain {#tub-curtain-rail}

Building classification: fixture. Ceiling-fixed supports/rail belong to the building stage; curtain textile belongs to the subsequent individual-object stage.
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns rail, hanging supports, curtain, and curtain-open; the room owner supplies ceiling height.
@evidence principles/core/common.md#substantive-completion It fixes rail diameter 0.025/length 1.80 m, curtain use length 1.80, height 2.05, support diameter 0.02, and 0.01 m curtain from wrapped rail centre to floor-relative 0.60 m.
@evidence principles/core/common.md#declared-basis Rail is 0.04 m waterward of tub front inside the parent reservation and matches the tub's 1.80 m length.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved position/height gain hanging support, four bent-panel folds, and curtain-open range 1.80–0.25 m.
@evidence principles/design/models.md#representation-contract Rail/supports/curtain use rail/rod/curtain, limiting gathered folds to four panel bends.
@evidence principles/design/models.md#spatial-convention The linear-member exception uses the rear rail end at height 2.05 m, no member over the 0.10 m wall-to-tub-rear gap, and +Z rail direction with yaw 0 mapping to world +Z.
@evidence principles/design/models.md#reviewable-structure Expanded/gathered oblique views challenge the curtain avoiding tub-use occupancy.
@evidence principles/design/models.md#model-observable-style-basis A 0.025 m round rail and bent-panel folds define abstraction without a label.
@evidence principles/design/models.md#model-scale-layer-completion Rail/curtain lengths, height, ceiling supports, curtain-open, and two-state observations determine blocking.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The former rail was 0.08 m dryward, risking water outside the tub, with no prototype occupancy strip; tub-fixture-use was corrected to 0.04 m inward and a 0.10 m strip consumed here.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use Waterward offset 0.04 m, strip width 0.10, height 2.05, and length 1.80 supply rail origin/occupancy.
@evidence settings/10-house.md#tub-bathroom Required rail/curtain becomes 0.025 m rail and a curtain whose expanded length changes through curtain-open.
@evidence obligations/design/models.md#articulation-ownership curtain-open changes expanded length 1.80–0.25 m, gathering within the rear 0.25 m.
@evidence obligations/design/models.md#model-representation-completion Rail/support/curtain layers, 1.80/2.05 m scale, curtain-open, three ids, and unverified observation owner record this prototype; following mats/bottles remain separate accounted prototypes.
-->

Adopt reference 02's tub-side screen as curtain/rail. Room-use reservations define actual expansion/gathering articulation.

The [room reservation](../spaces/rooms/tub-bath.md#tub-fixture-use) Z=[−8.70,−6.90] supplies the full 1.80 m tub length. This linear-member exception to [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) locates the origin at the rear rail end at height 2.05 m, with +Z along tub length. Placement yaw derives from that long axis. Rail diameter is 0.025, length 1.80 m; two 0.02 m hanging rods support its ends up to the ceiling. Add no rail/bracket across the 0.10 m wall-to-tub-rear gap. The room supplies ceiling height; supports share rail X and centre 0.01 m inward from ends, retaining their whole 0.02 m sections inside length 1.80.

The 0.01 m curtain runs from an upper edge wrapped around rail centre 2.05 to floor-relative 0.60 m. `curtain-open` changes expanded length 1.80–0.25 m, gathering within the rear 0.25 m with four bends. Rail faces use `rail`, ceiling supports `rod`, curtain front/back/cuts `curtain`. Fold normal offsets at knots are 0/+0.015/0/−0.015/0 m; adding thickness gives ±0.02 m from centre, within the 0.10 m strip. Rail/rod UVs use length-U/circumference-V; curtain uses length-U/height-V in metres. The source owner is `src/models/furnishings/sanitary-fittings.ts`. Expanded/gathered oblique views require the curtain to avoid tub-use occupancy. All observations remain unverified.

From upper ceiling 2.60 m, closed supports run from rail top 2.0625 to ceiling, height 0.5375 m. Lower ends meet rail top without overlapping metal volumes.

Using floor-relative heights, `rail` axis is X=0, Y=2.05, Z=[0,1.80], diameter 0.025; U follows +Z and V circumference. Two 0.02 m `rod` members at X=0, Z=0.01/1.79 occupy Y=[2.0625,2.60], meeting rail top/ceiling. Subsequent object-stage `curtain` has expanded Z=[0,1.80] or gathered [0,0.25], Y=[0.60,2.05], thickness 0.01; its longitudinal origin is the rear rail end.

## Thin floor mats in two bathrooms {#bath-floor-mats}
<!--
@evidence principles/core/common.md#scope-preservation Two mats cover already reserved fixture-use floors without duplicating slabs or tile faces.
@evidence principles/core/common.md#substantive-completion Shower 0.65×0.45×0.008 m leaves 0.125/0.075 m margins; tub 0.80×0.45×0.008 aligns with the 1.55 m long use face, leaving 0.375/0.30 m.
@evidence principles/core/common.md#declared-basis Shower/tub fixture-use standing regions supply hosts.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Thin textiles are added without changing circulation, door swings, or floor ownership.
@evidence principles/design/models.md#representation-contract Inner 0.04 m border and field divide all faces; wet state and fibre pile are omitted.
@evidence principles/design/models.md#spatial-convention Origin is host-use floor centre, local X parallel to fixture front, thickness Y=[0,0.008].
@evidence principles/design/models.md#reviewable-structure Top review checks mat bounds, door swings, and footholds inside use areas.
@evidence principles/design/models.md#model-observable-style-basis Small textile faces/narrow borders distinguish reference 05's bathroom from bare tile.
@evidence principles/design/models.md#model-scale-layer-completion Two variant bounds, thickness, faces, UVs, origins, and 02/05 review addresses are fixed.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Existing fixture-use floors include the 0.008 m thin covering without parent-boundary changes.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use The small mat fits 0.90×0.60 m shower waiting space.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use The small mat fits tub-front use width 1.05/length 1.55 m.
@evidence obligations/design/models.md#addressable-model-decisions A separate mat H2 keeps thin coverings distinct from ceramic/glass fixture accounting.
-->

Adopt references 02/05's bathroom mats. Centre a 0.65×0.45 m mat in [shower waiting](../spaces/rooms/shower-bath.md#shower-fixture-use) 0.90×0.60 m, leaving side 0.125/front-rear 0.075 m. Within [tub-front use](../spaces/rooms/tub-bath.md#tub-fixture-use) 1.05×1.55 m, align the 0.80 m long mat side with the 1.55 m tub direction, leaving (1.55−0.80)/2=0.375 m ends; its 0.45 m side across 1.05 leaves (1.05−0.45)/2=0.30 m. Both are 0.008 m thick. A 0.04 m `border` and inner `field` cover top/bottom/cuts without overlap. Origin is ground-contact floor centre, local X long/Z short, with metre X/Z UVs. No absorption, slip resistance, or actual drainage is claimed. The source owner is `src/models/furnishings/bathrooms.ts`; actual fixture collisions and GPU readability remain unverified.

## Containers in the shower niche {#shower-niche-bottles}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns only three bottles in the narrow left-wall niche; spaces owns its void and tile faces.
@evidence principles/core/common.md#substantive-completion It fixes diameters 0.06/0.07/0.055 m, heights 0.18/0.20/0.14 m, and gaps 0.025 m.
@evidence principles/core/common.md#declared-basis Reference 05's niche bottles and corrected shower-fixture-use width 0.40/depth 0.08 m supply the basis.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Three container heights and pumps populate the empty niche without treating wall surfaces as props.
@evidence principles/design/models.md#representation-contract Closed body container and cap/pump lid faces omit labels and contents.
@evidence principles/design/models.md#spatial-convention Origin is shelf centre, +Y up/+Z toward the shower user; instances derives positions from the host.
@evidence principles/design/models.md#reviewable-structure Section review challenges depth centre 0.04 m from rear and maximum radius 0.035 leaving 0.005 m at each end of 0.08 m depth.
@evidence principles/design/models.md#model-observable-style-basis Three differently sized bottles provide reference 05's used-bathroom identity, leaving colors/text to materials.
@evidence principles/design/models.md#model-scale-layer-completion Diameters, heights, gaps, ids, UVs, and host occupancy are fixed; spaces niche cuts were measured, while actual bottle meshes/GPU readability remain unverified.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work Missing host coordinates/closed rear thickness led to a niche reservation in shower-fixture-use; spaceSources then produced a closed niche and recorded part volumes with zero open/nonmanifold edges, while bottle meshes/GPU remained unverified.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use The left-partition 0.40×0.40×0.08 m niche contains three bottles.
@evidence obligations/design/models.md#addressable-model-decisions Wall/niche faces and internal bottle faces retain different branch owners.
-->

Adopt reference 05's three shower-niche bottles. Within [reserved](../spaces/rooms/shower-bath.md#shower-fixture-use) width 0.40/height 0.40/depth 0.08 m, diameters are 0.06/0.07/0.055 and heights 0.18/0.20/0.14. Gaps 0.025 give 0.06+0.07+0.055+2×0.025=0.235 m total and 0.0825 m ends. Closed 12-sided cylinders include 0.025 m diameter/0.035 m pumps within total heights. `container` covers bodies and `lid` caps/pumps; metre UVs use circumference-U/height-V. Origin is niche-shelf centre, +Y up/+Z toward users; `src/spaces/rooms/shower-bath.ts` owns actual wall cuts. Depth centres 0.04 m from rear, with maximum radius 0.035, leave rear/open-face clearance 0.005 m each. Bottoms contact the niche floor; the tallest top is 0.20 m above it, 0.20 below the niche ceiling. Fixed [model-review](00-model-frame.md#model-review-set) fronts compare heights/silhouettes; after actual placement, depth sections inspect both 0.005 m clearances and floor contact. Actual bottle source/GPU frames remain unverified. The source owner is `src/models/furnishings/bathrooms.ts`.
