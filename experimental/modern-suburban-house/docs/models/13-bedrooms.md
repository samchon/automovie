# Bedroom and wardrobe furniture prototypes

## Headboard bed {#headboard-bed}
<!--
@evidence principles/core/common.md#scope-preservation One W/L/H/B bed prototype covers the primary 2.15×1.60 m and two smaller 2.15×1.15 m reservations, omitting no bedroom bed.
@evidence principles/core/common.md#substantive-completion It fixes headboard thickness 0.06 m, 0.05 m square legs/height 0.10 m, frame Y=[0.10,0.30], mattress Y=[0.30,H−0.03], bedding thickness 0.03 m, and pillows 0.60×0.40×0.12 m.
@evidence principles/core/common.md#declared-basis Room reservations supply L/W/H/B; part thicknesses, leg height, and pillow counts are this H2's authored choices.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Parent bounds/H/B gain headboard, frame, mattress, bedding, pillows, and head orientation +X or -Z within one parameterized prototype.
@evidence principles/design/models.md#representation-contract Five part groups use headboard, bed-frame, mattress, bedding, and pillow boundaries; joints and quilt folds are omitted.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces the foot end; heights use the upper finished floor, and a 0.02 m bedding drop at feet/sides stays inside bounds.
@evidence principles/design/models.md#reviewable-structure Side views compare H/B to placement parameters; top views compare bounds with three reservations.
@evidence principles/design/models.md#model-observable-style-basis A 0.06 m headboard, frame on four corner legs, and 0.02 m side/foot bedding drop provide observable construction; materials owns bedding colors.
@evidence principles/design/models.md#model-scale-layer-completion Three L/W/H/B sets, local part occupancy and leg sections/positions, five boundaries, no joints, and side/plan observations determine the design; actual meshes and frames remain unverified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Three room bounds and H=0.60/0.55 m, B=1.00/0.95 m remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#primary-bedroom Two-adult bedding becomes primary width 1.60 m and two pillows.
@evidence settings/10-house.md#bedroom-two One-child bedding becomes width 1.15 m and one pillow.
@evidence settings/10-house.md#bedroom-three The other child's bed uses the same 1.15 m width/0.55 m height prototype, with placement-specific blue-grey bedding assigned to materials.
@evidence spaces/rooms/primary.md#primary-furniture-use Reserved X=[-1.50,0.65], Z=[-8.65,-7.05] supply L=2.15, W=1.60, H=0.60, B=1.00 m and head +X.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use Reserved X=[-5.25,-4.10], Z=[-4.50,-2.35] supply L=2.15, W=1.15, H=0.55, B=0.95 m and head -Z.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Reserved X=[-0.25,0.90], Z=[-3.10,-0.95] supply the same smaller-bed L/W/H/B and head -Z.
@evidence obligations/design/models.md#addressable-model-decisions One H2 addresses W/L/H/B, five parts/boundaries, and source owner src/models/furnishings/bedrooms.ts.
@evidence obligations/design/models.md#model-review-set Fixed model-review views own observations and the surface-partition naming rule owns boundary names.
@evidence obligations/design/models.md#reference-scale Reserved H=0.60 m primary/0.55 m small-room heights derive mattress Y=[0.30,H−0.03] plus 0.03 m bedding to meet H.
-->

Adopt reference 05's primary bed and reference 02's two smaller beds as one headboard family. Room reservations supply all three sizes.

One prototype accepts width W, length L, mattress-top H, and headboard-top B. [Primary reservation](../spaces/rooms/primary.md#primary-furniture-use) X=[-1.50,0.65], Z=[-8.65,-7.05] supplies L=2.15, W=1.60, H=0.60, B=1.00 m, head +X. [Bedroom two](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X=[-5.25,-4.10], Z=[-4.50,-2.35] and [bedroom three](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X=[-0.25,0.90], Z=[-3.10,-0.95] supply L=2.15, W=1.15, H=0.55, B=0.95 m, head -Z. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z toward feet and heights above the upper finished floor.

Parts are headboard, frame, mattress, bedding cover, and pillows. The local origin is the head-side rear-edge floor centre, with X=[−W/2,W/2], Z=[0,L]. The full-W, 0.06 m headboard occupies Z=[0,0.06], Y=[0,B]. Frame occupies X=[−W/2,W/2], Z=[0.06,L], Y=[0.10,0.30]. Four 0.05×0.05 m legs over Y=[0,0.10] align two outside faces with frame X/Z corners and meet its underside; all exposed leg faces use `bed-frame`. Mattress occupies X=[−W/2+0.02,W/2−0.02], Z=[0.06,L−0.02], Y=[0.30,H−0.03]. The cover adds 0.03 m above the mattress, dropping 0.02 m at feet/sides within the same X/Z outline. Pillows are 0.60×0.40×0.12 m with local Z centre 0.32; primary X centres ±0.40 and small-bed X=0 keep them within mattresses. Boundaries are `headboard`, `bed-frame`, `mattress`, `bedding`, and `pillow`. Materials assigns grey-beige, olive, and blue-grey bedding per placement. There are no joints; quilt folds are omitted.

The source owner is `src/models/furnishings/bedrooms.ts`. Side views compare H/B with placement values; top views compare the three bounds with reservations. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

## Nightstand and lamp {#nightstand-lamp}
<!--
@evidence principles/core/common.md#scope-preservation One S/T/U prototype includes lamps on two primary nightstands and one in each smaller bedroom.
@evidence principles/core/common.md#substantive-completion It fixes body X=[−S/2,S/2], Z=[0,S], Y=[0,T], drawer X=[−S/2+0.04,S/2−0.04], Y=[T−0.20,T−0.05], Z=[S−0.02,S], base diameter 0.14 m/centre (0,S/2), and shade diameter 0.25 m/height 0.22 m.
@evidence principles/core/common.md#declared-basis Room reservations supply S/T/U; absent drawer-operation reservations justify rigid drawer fronts.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds/top/lamp height gain body, drawer front, lamp base/stem/shade, and shade-top alignment with U.
@evidence principles/design/models.md#representation-contract Body, rigid drawer front, base/stem/frustum shade use carcass, drawer-front, lamp-base, and lamp-shade; lighting owns emission, while wiring, switches, and shade translucency are omitted.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces drawers and shade top reaches U.
@evidence principles/design/models.md#reviewable-structure Side views compare T/U; top views require shade bounds inside S.
@evidence principles/design/models.md#model-observable-style-basis Reference 02's bedside furniture becomes a square body, one drawer front, and 0.25 m frustum shade, without claims of lighting performance.
@evidence principles/design/models.md#model-scale-layer-completion S=0.50/0.45, T=0.55/0.50, U=1.10/1.05 m, five parts, four boundaries, rigid drawer, and unverified observations are jointly specified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Four nightstand coordinates and S/T/U remain unchanged, retaining absent parent drawer-operation reservations.
@evidence settings/10-house.md#primary-bedroom Two bedside tables/lights become Z=[-9.15,-8.65]/[-7.05,-6.55] and U=1.10 m.
@evidence settings/10-house.md#bedroom-two The bedside requirement becomes one table X=[-3.95,-3.50] and U=1.05 m.
@evidence settings/10-house.md#bedroom-three The bedside requirement becomes X=[1.05,1.50], Z=[-3.10,-2.65] using S=0.45 m.
@evidence spaces/rooms/primary.md#primary-furniture-use Two reserved nightstands at X=[0.15,0.65] use S=0.50, T=0.55, U=1.10 m.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use Reserved X=[-3.95,-3.50], Z=[-4.50,-4.05] use S=0.45, T=0.50 m.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Reserved X=[1.05,1.50], Z=[-3.10,-2.65] use S=0.45, U=1.05 m.
-->

Adopt reference 02's bedside tables and small lamps. Reservation heights determine shade dimensions hidden in reference 05.

One prototype accepts square width S, top T, and lamp top U. [Two primary nightstands](../spaces/rooms/primary.md#primary-furniture-use) use X=[0.15,0.65], Z=[-9.15,-8.65]/[-7.05,-6.55], S=0.50, T=0.55, U=1.10 m. [Bedroom two](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X=[-3.95,-3.50], Z=[-4.50,-4.05] and [bedroom three](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X=[1.05,1.50], Z=[-3.10,-2.65] use S=0.45, T=0.50, U=1.05 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z as drawer front.

Parts are body, one drawer front, lamp base, stem, and shade. The 0.15 m high drawer front below the top is rigid because the room reserves no operation. The lamp has a 0.14 m diameter, 0.025 m high base, 0.018 m stem, and 0.22 m frustum shade with lower diameter 0.25/upper 0.16 m. Shade top is U, bottom U−0.22, and the stem joins base top to shade bottom. Boundaries are `carcass`, `drawer-front`, `lamp-base`, and `lamp-shade`. Lighting owns emission; wiring, switches, and shade translucency are omitted. The source owner is `src/models/furnishings/bedrooms.ts`. Observe side T/U and shade fit inside S from above using fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`carcass` is a closed box X=[−S/2,S/2], Z=[0,S], Y=[0,T] with the drawer-front cell removed. The 0.02 m `drawer-front` occupies X=[−S/2+0.04,S/2−0.04], Z=[S−0.02,S], Y=[T−0.20,T−0.05], contacting cut faces only. The 0.14 m `lamp-base` centres at local (X,Z)=(0,S/2), bottom Y=T; stem and shade share its axis. Even S=0.45 m leaves 0.155 m on all sides of the base and 0.10 m around the 0.25 m shade.

## Low dresser {#low-dresser}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns one primary dresser, body, four legs, and six drawers.
@evidence principles/core/common.md#substantive-completion It fixes 1.40 m length/0.50 m depth/0.80 m height, 0.04 m square legs/0.08 m height, two-column/three-row drawer grids with 0.40 m travel, rear-leg Z=0.015, back panel starting Y=0.10, and side-bottom recesses.
@evidence principles/core/common.md#declared-basis Primary reservations supply bounds/top; operating X=[-5.00,-4.60] supplies 0.40 m travel.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds/operation gain 2×3 fronts, recessed handles, and named pivots.
@evidence principles/design/models.md#representation-contract Body/legs/six drawers use carcass, drawer-front, handle, and leg; handles are nonprojecting upper-edge recesses, and rails/interior partitions are omitted.
@evidence principles/design/models.md#spatial-convention +Z drawer fronts map to world +X at yaw π/2; each drawer slides at most 0.40 m in +Z.
@evidence principles/design/models.md#reviewable-structure Extended plans challenge drawers staying outside work-use X=[-4.60,-4.00].
@evidence principles/design/models.md#model-observable-style-basis Height 0.80 m, 0.08 m legs, 2×3 fronts, and recessed handles provide observable dresser construction.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, six-drawer divisions, pivots, four boundaries, and unverified extension observation are specified together.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Primary dresser X=[-5.50,-5.00], Z=[-6.50,-5.10] and operating reservations remain unchanged without parent revision.
@evidence settings/10-house.md#primary-bedroom The low-dresser requirement becomes height 0.80 m and length 1.40 m.
@evidence spaces/rooms/primary.md#primary-furniture-use Reserved X/Z supply bounds; operating X=[-5.00,-4.60] supplies travel limits.
@evidence obligations/design/models.md#articulation-ownership Six drawer-<column>-<row> pivots expose maximum +Z travel of 0.40 m.
-->

Adopt reference 05's dark dresser silhouette beyond the primary-room door. Storage function determines six drawers rather than counting photographic divisions.

The [primary reservation](../spaces/rooms/primary.md#primary-furniture-use) supplies X=[-5.50,-5.00], Z=[-6.50,-5.10], top 0.80 m, giving length 1.40 m, depth 0.50 m, height 0.80 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z drawer front mapping to world +X at yaw π/2.

Parts are body, four 0.08 m legs, and six drawers in two columns/three rows. Each `drawer-<column>-<row>` slides at most 0.40 m in +Z, matching [operating X=[-5.00,-4.60]](../spaces/rooms/primary.md#primary-furniture-use). Horizontally centred handle recesses sit 0.035 m below each upper edge, width 0.12 m, height 0.025 m, depth 0.012 m, without projection. Boundaries are `carcass`, `drawer-front`, `handle`, and `leg`; rails/interior partitions are omitted. The source owner is `src/models/furnishings/bedrooms.ts`. Extended plans require drawers not to enter work-use X=[-4.60,-4.00]. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Retain rear bounds and drawer fronts. Rear `leg` boundaries start at local Z=0.015; `carcass` back starts at Y=0.10; side-bottom Z=[0,0.015], Y=[0,0.10] is removed. Baseboards meet recesses, preserving 0.40 m front travel, top 0.80 m, and depth 0.50 m.

Four 0.04×0.04 m `leg` members centre at X=±0.665, Z=0.035/0.465, over Y=[0,0.08]. Rear ends Z=0.015 meet baseboards; front ends Z=0.485 stay within 0.50 m. Two `drawer-front` columns occupy X=[−0.67,−0.01]/[0.01,0.67], with rows Y=[0.12,0.32]/[0.35,0.55]/[0.58,0.78], all Z=[0.48,0.50]. `carcass` forms closed sides/back/top excluding those six front cells. Centred handle recesses avoid 0.02 m column and 0.03 m row gaps.

## Small desk {#child-desk}
<!--
@evidence principles/core/common.md#scope-preservation One length-L prototype covers both small-bedroom desks, including top, legs, shelf, and props.
@evidence principles/core/common.md#substantive-completion It fixes depth 0.60 m, top 0.75 m/thickness 0.03 m, four 0.04 m legs with explicit X/Z centres, shelf X=[−L/2+0.06,L/2−0.06], Z=[0.04,0.24], Y=[0.62,0.72], and props within the rear 0.25 m.
@evidence principles/core/common.md#declared-basis Room reservations supply L=1.20/1.15 m; three-book stacks and pencil pots instead of lamps are this H2's choices.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reserved bounds gain a shallow nonopening compartment shelf and 0.62 m knee clearance.
@evidence principles/design/models.md#representation-contract Top, four legs, compartment shelf, and props use top/leg/shelf/book/container/pencil without joints; book-cover detail, individual pencil detail, and top chamfers are omitted.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z faces the sitter, with props inside the rear 0.25 m of the top.
@evidence principles/design/models.md#reviewable-structure Side review challenges open 0.62 m knee space below the top.
@evidence principles/design/models.md#model-observable-style-basis A 0.03 m top, 0.04 m square legs, and 0.10 m shallow shelf define proportions, without a lamp.
@evidence principles/design/models.md#model-scale-layer-completion Two L values, top 0.75 m, four part layers, six boundaries, no joints, and unverified knee-space observation are jointly specified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Both room desk coordinates/L remain unchanged, with no parent defect identified.
@evidence settings/10-house.md#bedroom-two The study requirement becomes an L=1.20 m desk.
@evidence settings/10-house.md#bedroom-three The study requirement becomes L=1.15 m with the same learning function as the first child's room.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use Reserved X=[-5.50,-4.90], Z=[-1.60,-0.40] supplies L=1.20 m.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Reserved X=[1.40,2.55], Z=[-0.85,-0.25] supplies L=1.15 m.
-->

Reference 02 hides small-bedroom desk props, so book/pencil counts are authored rather than photographic evidence. Room reservations and settings' study places determine the prototype.

One desk accepts length L with depth 0.60 m and top 0.75 m. [Bedroom two](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X=[-5.50,-4.90], Z=[-1.60,-0.40] supplies L=1.20 m; [bedroom three](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X=[1.40,2.55], Z=[-0.85,-0.25] supplies L=1.15 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply with +Z toward the sitter.

Parts are 0.03 m top, four 0.04 m square legs, and one 0.10 m high shallow, nonopening compartment shelf below the top. Instead of a lamp, three 0.20×0.14×0.025 m books stack to 0.075 m; one 0.065 m diameter/0.10 m high pencil pot and four 0.006 m diameter/0.18 m pencils occupy the rear 0.25 m. Books use `book`, pot `container`, pencils `pencil`, structure `top`/`leg`/`shelf`. Every closed face uses one of these six ids. Tops/books use local width-U/length-V metre UVs; cylinders use circumference-U/height-V. There are no joints. Book-cover detail, individual pencil detail, and top chamfers are omitted. The source owner is `src/models/furnishings/bedrooms.ts`. Side views require open 0.62 m knee space below the top. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Both desks move rear-leg rear boundaries to local Z=0.015 to meet baseboards. Top/rear shelf contact wall finishes only above Y=0.10, without another rear panel descending to floor. Front legs and top fronts remain fixed, preserving both 0.60 m depths and chair-use regions.

`top` occupies X=[−L/2,L/2], Z=[0,0.60], Y=[0.72,0.75]. Four 0.04×0.04 m `leg` members centre at X=±(L/2−0.04), Z=0.035/0.565, over Y=[0,0.72]. Rear ends Z=0.015 meet baseboards; front ends Z=0.585 stay inside bounds. `shelf` occupies rear X=[−L/2+0.06,L/2−0.06], Z=[0.04,0.24], Y=[0.62,0.72], meeting the top underside. Front Z=[0.24,0.60] remains clear from floor to Y=0.72. The 0.62 m knee value is the lowest clearance immediately in front of/below the shelf; do not extend the shelf forward.

## Desk chair {#desk-chair}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns a separate chair prototype for two small-bedroom desks, distinguished from dining chairs.
@evidence principles/core/common.md#substantive-completion Without a body reservation, it chooses width 0.45 m, depth 0.48 m, seat 0.45 m, and back 0.82 m.
@evidence principles/core/common.md#declared-basis A seat 0.30 m below the 0.75 m desk and push/pull clearance within use regions justify dimensions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Dining-chair seat/leg/back construction becomes a separate prototype with a lower back and 0.48 m depth.
@evidence principles/design/models.md#representation-contract Seat/legs/back use seat/leg/back boundaries without joints; seat curvature, leg joints, and wheels are omitted.
@evidence principles/design/models.md#spatial-convention A 0.45×0.48 m body fits the 0.75×0.75 m chair-use reservation.
@evidence principles/design/models.md#reviewable-structure Review challenges inserted-chair fit between desk legs.
@evidence principles/design/models.md#model-observable-style-basis Back 0.82 m and depth 0.48 m distinguish proportions from the dining chair.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, seat/back heights, panel thickness, leg sections/positions, back-panel sizes, three boundaries, no joints, and unverified insertion observation are specified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The 0.75×0.75 m use reservation remains unchanged; this layer chooses body dimensions rather than treating absent body bounds as a parent defect.
@evidence settings/10-house.md#bedroom-two The desk/chair requirement becomes a chair with seat 0.45 m.
@evidence settings/10-house.md#bedroom-three The desk/chair requirement uses the same chair prototype in both bedrooms.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use The chair consumes the 0.75×0.75 m use reservation.
-->

References 02/05 do not show desk-chair forms. This H2 authors a simple panel-back chair fitting both desks/use reservations rather than attributing its back shape to those photographs.

One prototype serves both bedrooms' [chair-use reservation](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use), 0.75×0.75 m. Without body bounds, this layer chooses width 0.45 m, depth 0.48 m, seat 0.45 m, back 0.82 m, based on the 0.30 m desk/seat difference and room for pushing/pulling. It follows the [dining chair](10-kitchen-dining.md#dining-chair) seat/leg/back construction but is separate for different back height/depth.

Seat width 0.45 m/depth 0.48 m/thickness 0.03 m gives top 0.45 m. Four 0.035 m square legs centre 0.04 m inward from seat corners in both X/Z. The back has two same-section posts continuing rear legs and one 0.35×0.18×0.025 m panel, bottom 0.62 m, top 0.80 m, post top 0.82 m. It has no front/rear lean and sits 0.04 m forward of the rear seat edge, remaining within depth 0.48 m. Boundaries are `seat`, `leg`, and `back`; there are no joints. Seat curvature, leg joints, and wheels are omitted. The source owner is `src/models/furnishings/bedrooms.ts`. Observe inserted fit between desk legs using fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

## Sliding closet {#sliding-closet}
<!--
@evidence principles/core/common.md#scope-preservation One prototype covers both small-bedroom closet reservations, including leaves, front casing, rod, shelf, and clothes.
@evidence principles/core/common.md#substantive-completion It fixes 1.50×0.60×2.20 m bounds, two 0.76×2.16×0.02 m leaves, carcass front Z=0.49, rear/front tracks Z=[0.50,0.52]/[0.55,0.57], casing Z=[0.57,0.60], rod depth 0.28/height 1.65 m, shelf top 1.85 m, and formulas for 18 clothes; lower rear clears baseboard, with horizontal panels X=[−0.73,0.73], Z=[0.02,0.49] and back Z=[0,0.02] meeting only by face.
@evidence principles/core/common.md#declared-basis Both room reservations supply bounds and -X sliding fronts; leaf/rod/shelf dimensions are authored here.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds/fronts gain two tracks/leaves, rod/top shelf, and 18 formula-sized clothes.
@evidence principles/design/models.md#representation-contract Body, two leaves, rod, shelf, clothes, and front casing use carcass/leaf/handle/rail/rod/shelf/clothes/casing; rollers, individual hangers, and clothing folds are omitted.
@evidence principles/design/models.md#spatial-convention Origin is the rear-body floor centre with +Z front; rear/front leaves use Z=[0.50,0.52]/[0.55,0.57], travel at most 0.72 m along local X, and both start closed.
@evidence principles/design/models.md#reviewable-structure Open-state review challenges leaves remaining inside the body-front envelope.
@evidence principles/design/models.md#model-observable-style-basis References 02's small-room storage and 05's open closet become two-depth tracks, two 0.76 m leaves, and 2.20 m height.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, leaves/tracks/rod/shelf/casing, 18-clothing formulas, local-X closed-state motion, eight boundaries, and open-leaf observations are defined; actual source/frame remain unverified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Both closet coordinates, 1.50×0.60×2.20 m, and -X fronts remain unchanged without parent revision.
@evidence settings/10-house.md#bedroom-two Required clothing storage becomes a sliding closet at X=[-2.55,-1.95].
@evidence settings/10-house.md#bedroom-three Required storage uses X=[4.90,5.50] rather than copying the first child's coordinates.
@evidence settings/10-house.md#storage Leaves, hanging rod, top shelf, and actual 0.60 m interior depth prevent substituting empty doors for storage.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use Reserved X=[-2.55,-1.95], Z=[-2.95,-1.45] supplies the 1.50 m prototype.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Reserved X=[4.90,5.50], Z=[-2.80,-1.30] uses the same prototype.
@evidence obligations/design/models.md#articulation-ownership Front-left door-front moves +X and rear-right door-back moves -X over 0–0.72 m; both rest closed.
-->

Building classification: built-in. This floor-to-top closet fits a reservation in front of the room wall.

Adopt reference 02's small-bedroom storage and reference 05's open closet. Reservations and this H2's values determine leaf thickness and clothing counts rather than photographic measurement.

One prototype serves [bedroom two](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X=[-2.55,-1.95], Z=[-2.95,-1.45] and [bedroom three](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X=[4.90,5.50], Z=[-2.80,-1.30]. Both reserve width 1.50 m, depth 0.60 m, height 2.20 m and -X sliding fronts. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) use the rear-body floor centre as origin, +Z front.

Body bounds are X=[-0.75,0.75], Z=[0,0.60], Y=[0,2.20]. Side/back/bottom/top panels are 0.02 m thick; only the back spans full width at Z=[0,0.02]. Sides occupy X=[−0.75,−0.73]/[0.73,0.75], Z=[0.02,0.49]; bottom X=[−0.73,0.73], Z=[0.02,0.49], Y=[0,0.02]; top uses the same X/Z and Y=[2.18,2.20]. They meet only by face at X=±0.73 and Z=0.02, without common volume. Closed front-left `door-front` occupies X=[-0.75,0.01], Z=[0.55,0.57]; rear-right `door-back` X=[-0.01,0.75], Z=[0.50,0.52]. Each is 0.76×2.16×0.02 m at Y=[0.01,2.17], overlapping horizontally by 0.02 m when both rest closed. Front moves +X and rear -X over 0–0.72 m within width/depth. Each 0.02 m deep rectangular track spans 1.50 m at bottom Y=[0,0.01] and top Y=[2.17,2.20]. The 0.03 m diameter rod sits Z=0.28, Y=1.65; top shelf top 1.85, thickness 0.025, depth 0.45 m. Leaf handles are 0.10 m wide/0.025 m high/0.008 m deep recesses, centred 0.06 m outward from the meeting line at Y=1.05, without expanding bounds.

There are 18 clothes. For i=0…17, thickness is `0.035+0.005×(i mod 3)` m, front/rear width 0.38 m, and below-shoulder length `0.85+0.05×(i mod 3)` m. Six cycles total `6×(0.035+0.040+0.045)=0.720` m, arranged sequentially at rod centre X=[-0.36,0.36] with 0.39 m left at each end. Clothes centre on rod Z=0.28, occupying Z=[0.09,0.47], ending 0.03 m before rear-leaf inner Z=0.50. Shoulder tops Y=1.635 subtract rod radius 0.015 and touch its underside; longest clothes end Y=1.635−0.95=0.685. No hangers are modeled, and clothes do not penetrate the rod. Rounded-shoulder closed thin volumes omit hangers, sleeves, and folds. Boundaries here are `carcass`, `leaf`, `handle`, `rail`, `rod`, `shelf`, and `clothes`, with `casing` defined below. The source owner is `src/models/furnishings/bedrooms.ts`. Observe clothes/leaves within body bounds at closed and maximum-open states. Actual source and frames remain unverified.

White `casing` has three front panels. Verticals occupy X=[−0.75,−0.72]/[0.72,0.75], Z=[0.57,0.60], Y=[0,2.17]; head X=[−0.75,0.75], same Z, Y=[2.17,2.20]. Leaves slide at Z≤0.57 without volume overlap in closed/end states. Verticals reach floor and meet the head only at Y=2.17. All three remain inside 1.50×0.60×2.20 m; every front/back/end uses `casing`. Project length-U/width-V at 1 UV/m from vertical lower ends/head left end, restarting seams at panel ends.

`carcass` unions back X=[−0.75,0.75], Z=[0,0.02], Y=[0,2.20], side X=[−0.75,−0.73]/[0.73,0.75], Z=[0.02,0.49], and intervening horizontal X=[−0.73,0.73], Z=[0.02,0.49], Y=[0,0.02]/[2.18,2.20], with the rear-baseboard recess specified below removed. Front `leaf` occupies X=[−0.75,0.01], Z=[0.55,0.57], Y=[0.01,2.17]; rear `leaf` X=[−0.01,0.75], Z=[0.50,0.52], same Y. Rails span X=[−0.75,0.75] at both depth intervals and Y=[0,0.01]/[2.17,2.20], clear of carcass front Z=0.49. Rod axis X=[−0.73,0.73] has diameter 0.03, centre Y=1.65/Z=0.28; shelf occupies the same X, Z=[0.02,0.47], Y=[1.825,1.85]. Handle centres X=−0.06/+0.06, Y=1.05 recess 0.008 m from front/rear exterior Z=0.57/0.52. Casing verticals/head retain the bounds above and contact front-leaf end Z=0.57 only by face.

The 0.02 m side/bottom/top panels extend only from back front Z=0.02 to Z=0.49. Rear tracks/leaves Z=[0.50,0.52] and front Z=[0.55,0.57] slide in the remaining 0.11 m front separation. The 1.50 m rails lie in front of sides without penetrating them; even at shared heights, bottom/top rails have no shared volume with panels ending at Z=0.49. Both leaves remain inside X=[−0.75,0.75] at rest and travel ends.

As in the [small-bedroom reservation](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use), this is a box built-in in front of a flat right wall, requiring no wall opening or niche. Back Z=[0,0.02] removes Z=[0,0.015] over Y=[0,0.10]; sides already start at Z=0.02 and avoid that strip. Remaining back contacts the wall above Y=0.10; bottom sits between sides at X=[−0.73,0.73], Z=[0.02,0.49], Y=[0,0.02]. The [baseboard prototype](06-interior-trim.md#wall-baseboard) continues behind both closets through their recesses. It does not terminate at closet fronts 0.60 m from walls; wall runs continue past ends and closed end caps occur only at door casing or actual wall ends. Bounds and 0.72 m leaf travel remain unchanged.

## Thin curtains for eight windows, starting in the primary bedroom {#primary-window-curtains}
<!--
@evidence principles/core/common.md#scope-preservation One curtain prototype serves two primary and six living/family/small-bedroom windows, eight total, without owning wall/frame/glass faces.
@evidence principles/core/common.md#substantive-completion Inputs are W, head height, and floor; rod centre is 0.10 m above the head, curtain bottom 0.10 m above floor, projection at most 0.106 m, and each end gathers to 0.18 m.
@evidence principles/core/common.md#declared-basis Primary-furniture-use supplies two windows; selected-window-curtain-strips and facade widths supply six others; this prototype owns rod/textile geometry.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The two parent occupancy sets gain shared open state, folds, parts, and partitions for all eight windows.
@evidence principles/design/models.md#representation-contract Rod, supports, and two thin panels use rod/bracket/curtain, with fixed-open state and three broad folds only.
@evidence principles/design/models.md#spatial-convention Origin is the opening's inner lower-left, U width, V up, +N roomward; placement changes only facade-axis rotations.
@evidence principles/design/models.md#reviewable-structure Front review challenges mostly-open windows with 0.18 m end gathers; side review challenges the 0.12 m cap.
@evidence principles/design/models.md#model-observable-style-basis Straight rods and separate thin drapes read as curtains across eight windows; materials owns weave/transmission.
@evidence principles/design/models.md#model-scale-layer-completion Eight W/head/floor inputs, 0.106 m projection, three ids, fixed-open state, and two-direction review are jointly specified.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work Primary-furniture-use previously corrected insufficient lateral/vertical bounds; missing six-window strips led to spaces/06-openings.md#selected-window-curtain-strips, and bedroom-two-furniture-use corrected its attribution of curtains to settings into a separate spatial handoff, directly supporting eight-window consumption.
@evidence settings/10-house.md#primary-bedroom Thin-curtain requirements apply to primary rear/left windows; the other six repetitions derive from separate spaces curtain strips rather than a settings distinction.
@evidence spaces/envelope/rear.md#primary-rear-window Rear X=[-3.85,-1.45] supplies first-placement W=2.40 m.
@evidence spaces/envelope/left.md#primary-left-window Side Z=[-8.90,-7.30] supplies second-placement W=1.60 m.
@evidence spaces/rooms/primary.md#primary-furniture-use Host width W+0.20 m, vertical range, and roomward 0.12 m bound all rod/bracket/curtain occupancy.
@evidence spaces/06-openings.md#selected-window-curtain-strips Six living/family/small-bedroom windows supply W+0.20 m, 0.12 m above heads, 0.10 m above finished floors, and 0.12 m roomward strips.
@evidence obligations/design/models.md#representation-ceiling Only broad thin-drape folds are modeled, without thread, sewing, or cloth dynamics.
-->

Adopt reference 05's thin grey primary curtains. References 03/04 have bare common-room windows, but six additional windows use the same thin prototype to realize reviewed spaces' living/family/small-bedroom curtain decisions. This is a visual departure from those bare windows, with no photographic attribution for absent curtains. Panel-width formulas determine folds rather than copying the photograph.

[Primary rear](../spaces/envelope/rear.md#primary-rear-window) has W=2.40 m and [primary left](../spaces/envelope/left.md#primary-left-window) W=1.60 m. In [shared-strip order](../spaces/06-openings.md#selected-window-curtain-strips), the six others have W=2.80/1.20/2.00/1.70/2.10/2.10 m. H derives from each host's head/sill; only host values supply opening world-bottom heights. Origin is inner lower-left, U width, V up, +N roomward. Front/rear/left/right placements differ only by axis rotation, sharing formulas. Rod centre V=H+0.10, spanning U=[-0.10,W+0.10]. Drapes run from 0.10 m above the finished floor to rod centre, wrapping their upper 0.025 m around the rod. Local bottoms are V=-0.75 for primary/small rooms, -0.60 for living front, -0.65 for living side/both family windows. Each end panel gathers to 0.18 m in fixed-open state. Rod radius 0.0125 plus cloth thickness 0.006 puts the highest point 0.1185 m above the opening, leaving 0.0015 m within both parents' 0.12 m top strip. Wrapped tops leave no floating gap.

Parts are a 0.025 m rod, two end supports, and two thin panels. Rod centre is +N 0.06 m from the inner wall. For panel-width u∈[0,0.18], textile midplane `N(u)=0.083+0.02 sin(6πu/0.18)` m makes three folds, with 0.006 m thickness split on either side; maximum front N=0.106. Supports stay in +N 0–0.08. Total projection 0.106 m fits [primary occupancy](../spaces/rooms/primary.md#primary-furniture-use) and [six-window strips](../spaces/06-openings.md#selected-window-curtain-strips), each 0.12 m. Ids are `rod`, `bracket`, and `curtain`; both panels across eight placements share the textile partition. Materials binds weave/transmission; thread, seams, and dynamics are omitted. The source owner is `src/models/furnishings/bedrooms.ts`. [Model-review](00-model-frame.md#model-review-set) fronts require mostly-open windows between 0.18 m gathers; sides require projection within 0.12 m and no sill/handle interference. Actual members, occupancy, and GPU frames remain unverified.

Left-panel global width U=[0,0.18] uses u=U; right U=[W−0.18,W] uses u=W−U to mirror folds. At minimum N, cloth rear is 0.083−0.020−0.003=0.060 m, meeting sill front 0.060 only by face without penetration.

## Wardrobe hanging section {#wardrobe-hanging}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the wardrobe hanging reservation as one rod/top-shelf/carcass/clothing model.
@evidence principles/core/common.md#substantive-completion Inside 2.15 m length/0.55 m depth, two 0.03 m sides leave actual 2.09 m rod/shelf spans; rod depth 0.28/height 1.65 m, shelf top 2.05 m, and 36 clothes thickness 0.035–0.045/width 0.50 m are fixed.
@evidence principles/core/common.md#declared-basis Reservations supply bounds/top 2.05 m; clothing-panel sizes and index formulas are authored here.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds/height gain rod position, top shelf, and i mod 3 clothing-panel bundles.
@evidence principles/design/models.md#representation-contract Rod/shelf/carcass/clothes use rod/shelf/carcass/clothes without joints; individual hangers, sleeves, and folds are omitted.
@evidence principles/design/models.md#spatial-convention Clothes stay between rear wall and 0.55 m front, inside Z=[-10.45,-9.90].
@evidence principles/design/models.md#reviewable-structure Top review challenges clothing fronts staying behind Z=-9.90.
@evidence principles/design/models.md#model-observable-style-basis Reference 05's open-closet clothes become 36 panels with index-defined 0.035–0.045 m thickness and 0.50 m width.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, four part layers/boundaries, no joints, and unverified clothing-front observation are specified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved X=[2.10,4.25], Z=[-10.45,-9.90], height 2.05 m remain unchanged without parent revision.
@evidence settings/10-house.md#primary-bedroom Separate clothing storage's hanging section uses outside width 2.15 m with actual 2.09 m rod/shelf spans.
@evidence settings/10-house.md#storage Rod, top shelf, and actual 0.55 m depth avoid substituting empty leaves for storage.
@evidence spaces/rooms/wardrobe.md#wardrobe-storage-use Reserved X/Z/top supply length 2.15 m and depth 0.55 m.
@evidence obligations/design/models.md#representation-ceiling i mod 3 fixes thickness/length of panel-bundle proxies; supported observation is limited to clothing fronts not passing Z=-9.90 in top view.
-->

Building classification: built-in. Carcass sides and rod fit the wardrobe floor/side reservations.

Adopt reference 05's clothes in the hall-side open closet. Deterministic rules set the 36 garments' thickness/length order rather than counting photographic clothes.

The [wardrobe reservation](../spaces/rooms/wardrobe.md#wardrobe-storage-use) supplies X=[2.10,4.25], Z=[-10.45,-9.90], top 2.05 m above the upper floor, giving length 2.15 m and depth 0.55 m. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply. Rod depth is 0.28 m/height 1.65; top shelf top is 2.05/depth 0.55 m. For i=0…35, clothes have thickness `0.035+0.005×(i mod 3)` m, front/rear width 0.50 m, and hanging length `0.85+0.10×(i mod 3)` m. Thickness ranges 0.035–0.045, totaling 1.44 m centred on the actual 2.09 m rod with 0.325 m each side. Shoulders sit 0.05 m below the rod; longest clothes end at least 0.55 m above floor within the rear-wall/front bounds. Boundaries are `rod`, `shelf`, `carcass`, and `clothes`; there are no joints. Hangers, sleeves, and folds are omitted. The source owner is `src/models/furnishings/bedrooms.ts`. Top views require fronts not passing Z=-9.90. Use fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

`carcass` consists of freestanding sides within reservations, requiring no wall hole: left X=[2.10,2.13], right [4.22,4.25], both Z=[−10.45,−9.90], Y=[0,2.05]. Remove rear 0.015 m over lower 0.10 m for baseboard; fronts still contact floor. A 0.03 m `rod` spans X=[2.13,4.22], centre Z=−10.17/Y=1.65, contacting inner side faces. Reserved outside 2.15 m thus gives actual rod length 2.09. The 1.44 m clothes occupy its centre, leaving 0.325 m ends. A 0.03 m `shelf` occupies X=[2.13,4.22], Z=[−10.45,−9.90], Y=[2.02,2.05], meeting inner faces without shared volume.

Both 0.03 m `carcass` sides retain those bounds and remove baseboard strip Y=[0,0.10], Z=[−10.45,−10.435], contacting shelf ends only at inner faces.

## Wardrobe shelf section {#wardrobe-shelves}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns four wardrobe shelves, folded clothes, and shoe boxes.
@evidence principles/core/common.md#substantive-completion Inside 1.10 m length/0.55 m depth, two 0.03 m sides leave 1.04 m shelves; tops 0.20/0.65/1.10/1.55 m, thickness 0.03 m, and boxes/basket 0.30×0.35×0.20 m are fixed.
@evidence principles/core/common.md#declared-basis Reservations supply bounds; four levels starting 0.20 m at 0.45 m intervals are authored here.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounds gain four heights and folded-clothing/shoe-box proxies.
@evidence principles/design/models.md#representation-contract Shelf/carcass/folded-clothes/shoe-box/basket hierarchy uses shelf/carcass/folded/shoe-box/basket without joints; folded layers, shoe shapes, and brackets are omitted.
@evidence principles/design/models.md#spatial-convention Furniture-local shelves start 0.20 m above floor at 0.45 m intervals.
@evidence principles/design/models.md#reviewable-structure Front review challenges readability of four levels.
@evidence principles/design/models.md#model-observable-style-basis Four 0.03 m open shelves, three 0.30×0.35×0.20 m boxes, one same-sized basket, and eight folded-clothing piles define observable construction.
@evidence principles/design/models.md#model-scale-layer-completion Bounds, four heights, five boundaries, no joints, and unverified front observation are specified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Reserved X=[4.40,5.50], Z=[-10.45,-9.90] remain unchanged without parent revision.
@evidence settings/10-house.md#storage Shelf storage becomes a 0.55 m deep section with folded clothes and shoe boxes.
@evidence settings/10-house.md#primary-bedroom Separate primary clothing storage's folded-clothes share becomes four shelves.
@evidence spaces/rooms/wardrobe.md#wardrobe-storage-use Reserved X/Z supply outside length 1.10 m/depth 0.55 m.
@evidence obligations/design/models.md#model-representation-completion This final H2 records heights, box/basket dimensions, five boundaries, no joints, and unverified front observation for its representation-completion share.
-->

Building classification: built-in. Shelf carcass fits the wardrobe floor/side reservations.

The [reservation](../spaces/rooms/wardrobe.md#wardrobe-storage-use) supplies X=[4.40,5.50], Z=[-10.45,-9.90], giving length 1.10 m/depth 0.55 m. Four 0.03 m shelves have tops 0.20/0.65/1.10/1.55 m above floor at 0.45 m intervals. Each holds two folded-clothes piles and one right-side container: shoe boxes on the lower three and reference 05's basket on top. Piles are 0.28×0.32×0.12 m; boxes/basket 0.30×0.35×0.20. The basket is open upward with 0.015 m walls and two 0.025 m diameter round side handles. Two 0.02 m gaps bring total width to 0.90 m, leaving 0.07 m ends within actual 1.04 m shelf length. Totals are eight piles, three boxes, one basket; each height is less than 0.45 m shelf spacing. [Furniture-local coordinates](00-model-frame.md#model-furniture-local-frame) apply. Boundaries are `shelf`, `carcass`, `folded`, `shoe-box`, and `basket`; there are no joints. Folded layers, shoe shapes, and brackets are omitted. The source owner is `src/models/furnishings/bedrooms.ts`. Front views require four readable levels using fixed [model-review views](00-model-frame.md#model-review-set) and [surface partition names](00-model-frame.md#model-surface-partition-naming). All observations remain unverified.

Two 0.03 m `carcass` sides occupy left X=[4.40,4.43], right X=[5.47,5.50], both Z=[−10.45,−9.90], Y=[0,1.78]. Rear 0.015 m over Y=[0,0.10] clears baseboard; the right side against X=5.50 also clears X=[5.485,5.50] over that height. Remove the intersecting rectangular union once. Four `shelf` panels span inner faces X=[4.43,5.47] with the same depth, each 0.03 m below its top. Centre the 0.90 m prop total within actual 1.04 m length to leave 0.07 m ends. Shelf ends contact side inner faces without entering their volume.
