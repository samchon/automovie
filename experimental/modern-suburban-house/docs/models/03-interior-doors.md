# Interior door leaves and frames

## Interior-door member hierarchy and dimensions {#interior-door-members}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the shared prototype for 11 interior doors, 0.03 m jambs, 0.04 m leaves, jamb depth, casing, panels, handles, UVs and swing radii.
@evidence principles/core/common.md#substantive-completion Clear width = rough width−0.10 meets every target; leaf height is 2.16 m, radii 0.89·0.94·0.99 m and handle height 0.95 m. Closed leaf Z=[−0.04,0], hinge axis Z=0 and mirrored rotation signs keep open-leaf thickness inside the jamb.
@evidence principles/core/common.md#declared-basis Targets come from each room-plan H2; 0.15 m partitions and the 0.25 m shared garage wall come from room owners and spaces/00-building.md#attached-garage-extent; panel doors come from settings/10-house.md#openings.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns room owners' effective-width targets into jamb/leaf thickness decisions consuming the common 0.10 m difference.
@evidence principles/design/models.md#representation-contract It defines door→jamb·casing·hinge-pivot→leaf·handle hierarchy.
@evidence principles/design/models.md#spatial-convention The opening-side wall face is the origin plane, making opening always local +Z.
@evidence principles/design/models.md#reviewable-structure Measuring clear width at a jamb-face section can falsify it.
@evidence principles/design/models.md#model-observable-style-basis All 11 interior doors share one prototype and the common local frame; the origin plane is the wall face toward which the leaf opens. Two recessed panels and 0.07 m casing specify the white panel-door appearance.
@evidence principles/design/models.md#model-scale-layer-completion It defines the jamb-depth layer and clear-width scale.
@evidence spaces/00-building.md#attached-garage-extent Shared garage wall X = [5.50, 5.75] m supplies laundry-garage-door jamb depth 0.25 m.
@evidence settings/10-house.md#openings White interior casing and panel doors become 0.07 m casing and two recessed panels.
@evidence contracts/reservation-fit.md#reservation-fit Subtracting jambs 2×0.03 m and leaf thickness 0.04 m from rough width arithmetically meets all 11 clear-width targets.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work spaces/07-boundary-assembly.md#interior-boundary-junctions assigned frames/leaves to 05 room owners, duplicating this prototype. The parent H2 was corrected to assign wall cuts/floor transitions to spaces and closed jambs/casing/leaves/hardware to models/03. spaces/03-surface-owners.md#interior-surface-handoff was clarified so room-face owners inspect only reveals/finish interfaces and do not create model door/window meshes. Room opening coordinates and clear-width targets were preserved.
@evidence spaces/03-surface-owners.md#interior-surface-handoff Room-owner reveals/finish interfaces and this prototype's closed frame/leaf fit the same void without duplicating faces.
@evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A single wall between rooms supports one jamb member covering its full thickness.
@evidence spaces/07-boundary-assembly.md#interior-boundary-junctions Room-owner wall cuts/floor transitions are inputs; the model prototype produces only closed jambs/casing/leaves/hinges/handles.
@evidence settings/10-house.md#upper-hall Reference 05's white casing/leaves become 0.07 m casing and recessed-panel leaves for five upper-hall doors.
-->

This prototype takes wall cuts/reveals and floor transitions from room owners at [interior-wall junctions](../spaces/07-boundary-assembly.md#interior-boundary-junctions). Only `src/models/interior-door.ts` creates closed jambs, casing, leaves, hinges and handles; neither room's spaces source duplicates them.

All 11 interior doors share one prototype and the [common local frame](00-model-frame.md#model-local-frame), with origin plane at the wall face toward which the leaf opens. Every rough opening is 2.20 m high and 0.95–1.05 m wide; each room owner's effective-width target is 0.10 m below rough width. Use this common difference to choose 0.03 m opening-facing jamb width on each side and 0.04 m leaf thickness. At 90° opening, clear width is rough width − 2 × 0.03 − 0.04, exactly each target. Leaf width is rough width − 0.06 m; height is rough height − 0.03 m head jamb − 0.01 m floor clearance = 2.16 m. Jamb depth equals the opening-owning wall thickness: 0.15 m supplied by room owners for interior partitions; only the [laundry–garage door](../spaces/rooms/laundry.md#laundry-plan) uses the [shared garage wall's](../spaces/00-building.md#attached-garage-extent) 0.25 m. Calculate world transforms from owner opening coordinates.

Under `door`, place `jamb` (left/right/head), `casing` on both wall faces and `hinge-pivot` containing `leaf` and `handle`. To realize the white interior casing in [settings openings](../settings/10-house.md#openings), choose 0.07 m wide strips projecting 0.015 m from the wall. Projection follows [common material/envelope appearance](../settings/20-verification.md#visual-grammar), where trim explains junctions through actual projection and shadow. Width is a model decision below [06's exterior-trim limit 0.10 m](../spaces/06-openings.md#external-opening-interface), making interior casing read as lighter than exterior trim. For the white panel doors adopted from references 03–05 in [settings openings](../settings/10-house.md#openings), each leaf has upper/lower panels recessed 0.008 m. Leaf bottom is 0.01 m above floor; panel local heights above floor are [0.18, 0.86]·[0.98, 1.98] m. With 0.12 m margins at both sides, panel width is W − 0.24 m for leaf width W. A 0.12 m strip remains between panels and a 0.19 m head strip above. Recess floors/four reveals are `leaf-panel`; remaining front/back and four thickness faces are `leaf`. Two panels are the simplest model subdivision reading as a panel door rather than a flat board in the interior threshold view (FOV 60°) of the [review frame condition](../settings/20-verification.md#frame-condition). Leaf faces use planar normals and meter-based UVs aligned to leaf-local X/Y so materials can bind paint or grain consistently. Swing radius equals leaf width: 0.89·0.94·0.99 m for rough widths 0.95·1.00·1.05 m. Handles lie inside the leaf edge and do not increase radius. The seven standard doors adopt reference 05's round black handles as two 0.05 m diameter spherical knobs and two circular roses, diameter 0.065 m/thickness 0.006 m. Centers are 0.95 m above floor (half the 1.90 m usage-profile occupant height, chosen within adult/child hand-height range) and 0.07 m inside the free leaf edge. Each projects 0.056 m from its leaf face. Hinges are three cylindrical knuckles, diameter 0.018 m/length 0.08 m, centered 0.20·1.05·1.90 m above leaf bottom, with surface id `hinge`. At 90° opening the handle is at the free end, outside the jamb-face clear-width section. The source owner is `src/models/interior-door.ts`; measure clear width at the jamb-face section.

The construction equations for jambs, casing, leaves, handles and hinge axes below use horizontal coordinate u=0 at the rough opening's left end and u=W at its right end. Their X=[a,b] notation means u=[a,b] unless explicitly identified as world X. The centered opening-local frame converts it to X=[a−W/2,b−W/2]; Y is height above the opening's lower-edge datum unless explicitly identified as world Y. These construction coordinates do not replace the common lower-center prototype origin.

For wall thickness T=0.15 m, or T=0.25 m only at the laundry–garage door, jamb vertical bodies occupy X=[0,0.03]·[W−0.03,W] m, Y=[0,2.17] m, Z=[−T,0] m. The head occupies X=[0,W] m, Y=[2.17,2.20] m, Z=[−T,0] m. Verticals meet the head only at Y=2.17 m, avoiding duplicate volume. Opening-side `jamb-a` is the Z=0 m outer face of both vertical bodies at X=[0,0.03]·[W−0.03,W] m and head X=[0,W]·Y=[2.17,2.20] m. Opposite `jamb-b` has the same X/Y regions at outer Z=−0.15 m for normal walls or Z=−0.25 m for the laundry–garage wall; buried parts are not exposed faces. Cover opening-inner side reveals X=0.03·W−0.03 m, head underside Y=2.17 m and remaining board cut ends with `jamb-core`, at depth Z=[−T,0] m. Closed leaf width W−0.06 m occupies X=[0.03,W−0.03] m between jamb inner faces and Y=[0.01,2.17] m, touching jambs only along sides/top.

Casing positions use the 11 openings' local coordinates, except the corner-side board of the tub-bath door is clipped at the wall boundary below. The horizontal construction coordinate u used only in the following casing dimensions has zero at the rough opening's lower-left; W=0.95·1.00·1.05 m follows the room. In the common vertical/head equations immediately below, X=[a,b] means u=[a,b]; placement in the [common local frame](00-model-frame.md#model-local-frame) with centered origin converts it to X=[a−W/2,b−W/2]. Subsequent world X denotes actual world coordinates. At each finished wall face, opening side A and opposite B, `casing-a`/`casing-b` jamb boards occupy X=[−0.07,0]·[W,W+0.07] m, Y=[0,2.20] m; heads occupy X=[−0.07,W+0.07] m, Y=[2.20,2.27] m. Backs meet each room's finished wall and fronts project 0.015 m into that room. Both jamb feet reach each room's finished floor; the space owner creates the threshold plate only within opening width. Heads meet jamb tops at right angles without duplicate volume. At the shared garage wall, opening-side laundry `casing-a`'s +Z jamb occupies [laundry-garage-door](../spaces/rooms/laundry.md#laundry-plan) world X=[5.485,5.50], Z=[−3.35,−3.28], Y=[0,2.20] m. Opposite garage `casing-b` starts at garage finished floor Y=−0.15 m; only that board extends to height 2.35 m, ending at door head Y=2.20 m. Washer, counter and upper-cabinet recesses clear the closed laundry-side volume. Pantry shelves neighbor the separate service-pantry-door casing, so the pantry-shelf H2 defines their cuts.

At hall-tub-door, the corridor-side −Z corner leaves only 0.05 m to the next shower-bath partition start Z=−5.91 m. Its corridor `casing-b` −Z jamb therefore occupies world Z=[−5.91,−5.86]·X=[3.055,3.07] m, upper-floor-relative Y=[0,2.20] m; the head's −Z end also closes at −5.91 m. The opposite +Z board retains common width 0.07 m. New −Z cut faces are `casing-b`, meeting the shower partition world Z≤−5.91 m only at a face.

For a low-X hinge, the closed standard round `handle` center is X=W−0.10 m; for a high-X hinge, X=0.10 m; Y=0.95 m. Its two 0.065 m roses meet leaf front/back Z=0·−0.04 m. Each combination of 0.006 m rose thickness and 0.05 m spherical knob projects a total 0.056 m beyond its face, remaining inside closed-leaf X=[0.03,W−0.03] m. Three leaf-attached `hinge` axes lie at low-hinge X=0.03 m or high-hinge X=W−0.03 m intersecting opening-side Z=0 m. Their centers are opening-floor-relative Y=0.21·1.06·1.91 m, 0.20·1.05·1.90 m above leaf bottom Y=0.01 m; add the opening's lower world Y once during placement. Each occupies diameter 0.018 m and length 0.08 m.

The pantry door uses circular recessed grips on both leaf faces instead of projecting knobs, meeting the [pantry operating reservation's](../spaces/rooms/pantry.md#pantry-plan) 0.08 m total for jamb/leaf/handle. Recess diameter is 0.05 m, depth 0.008 m, center 0.95 m above floor and 0.07 m inside the free edge. Groove interiors/rims are `handle` without enlarging the leaf envelope. Jamb 0.03 m + leaf thickness 0.04 m = 0.07 m leaves 0.01 m within the reservation. The [wardrobe door's](../spaces/rooms/wardrobe.md#primary-wardrobe-plan) round `handle` on each side combines a 0.004 m thick, 0.035 m diameter rose and 0.026 m diameter spherical knob, projecting only 0.004+0.026=0.030 m from each broad leaf face. Centers match common doors at 0.07 m inside the free edge and 0.95 m above floor. The opposite-face handle tip on the open leaf meets reviewed-swing world Z=−10.20 m without passing beyond it. service-laundry-door and laundry-garage-door use the same 0.05 m diameter, 0.008 m deep circular recessed grips as the pantry, preventing handles from projecting into the [mudroom crossing](../spaces/rooms/laundry.md#laundry-through-route) at reference opening. The other seven doors use 0.056 m projecting round handles. All 11 share heights and surface ids.

Fix closed `leaf` depth at Z=[−0.04,0] m, with opening-side A finished wall as local Z=0. Broad leaf faces lie inside the rough opening rather than the wall body. The vertical hinge axis is the intersection of hinge-jamb opening-inner X=0.03 or W−0.03 m and Z=0. A low-X hinged closed leaf extends +X from its axis and opens by local −π/2 rotation; a high-X leaf extends −X and opens by +π/2. Both mirrored operating scalars have magnitude 0–π/2 rad. At 90°, the leaf occupies only opening-inner X thickness 0.04 m and roomward Z=[0,W−0.06] m relative to the hinge, penetrating neither opposite jamb nor wall. Recess `leaf-panel` depth 0.008 m inward from both broad faces, without adding it outward. Compare closed-leaf handles/panels and open occupancy with each room reservation as specified above.

At each `hinge` center Y=0.21·1.06·1.91 m, subtract a radius 0.009 m disk around hinge axis X=0.03 or W−0.03 m·Z=0 over height ±0.04 m from both the `jamb` vertical body and `leaf` body. Recessed cylindrical walls in the fixed jamb receive opening-side `jamb-a` and cut-face `jamb-core`; those in the rotating leaf receive `leaf`. The cylinder placed in the subtraction has outer/end faces `hinge`. Leaf cuts also rotate with the leaf under `hinge-pivot`. Thus hinge/jamb/leaf closed volumes do not overlap when closed, and at reference π/2 the fixed hinge cylinder is not buried in the leaf.

## Interior-door hinge assignments and reference states {#interior-door-hinges}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns hinge-pivot positions, range 0–π/2 rad, reference π/2 opening, hinge sides/opening directions for 11 doors and two mirrored variants.
@evidence principles/core/common.md#substantive-completion It defines the hinge axis as the vertical line at the hinge-jamb inner corner/opening-side wall face and enumerates every hinge side.
@evidence principles/core/common.md#declared-basis Hinge sides/opening directions come from room-plan H2s; reference opening comes from settings/10-house.md#openings.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It specifies the settings open-door requirement as each leaf's π/2 rad reference rotation and two-sided handle occupancy.
@evidence principles/design/models.md#representation-contract It limits the hierarchy to two mirrored variants with hinge side local -X or +X.
@evidence principles/design/models.md#spatial-convention Opening is always local +Z.
@evidence principles/design/models.md#reviewable-structure Each room threshold view can falsify whether the open leaf invades the door-front clearance.
@evidence principles/design/models.md#model-observable-style-basis Reference 05's open room door is adopted as a hinged member. It defines observable hinge placement without a style label.
@evidence principles/design/models.md#model-scale-layer-completion It defines articulation interfaces/reference states for every interior door.
@evidence obligations/design/models.md#articulation-ownership The sole interior-door motion interface is hinge-pivot rotation 0–π/2 rad with reference state π/2 open.
@evidence settings/10-house.md#openings The requirement that open reference doors make circulation readable becomes π/2 rad reference opening.
@evidence spaces/rooms/living.md#living-plan entry-living-door's -Z jamb and living-side -X opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/powder.md#powder-plan service-powder-door's -Z jamb/+X opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/laundry.md#laundry-plan service-laundry-door/laundry-garage-door's -Z jambs and mudroom-inward opening determine hinge-pivot placement and mirrored variants.
@evidence spaces/rooms/pantry.md#pantry-plan service-pantry-door's +Z jamb/+X opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-plan hall-bedroom-two-door's +X jamb/+Z opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-plan hall-bedroom-three-door's -Z jamb/+X opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/primary.md#primary-plan hall-primary-door's -X jamb/-Z opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/shower-bath.md#shower-bath-plan hall-shower-door's -X jamb/-Z opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/tub-bath.md#tub-bath-plan hall-tub-door's +Z jamb/+X opening determine hinge-pivot placement and mirrored variant.
@evidence spaces/rooms/wardrobe.md#primary-wardrobe-plan primary-wardrobe-door's -Z jamb/-X opening determine hinge-pivot placement and mirrored variant.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work entry-living-door's reference swing radius 0.94 m exceeded the former 0.90 m reservation in spaces/rooms/living.md#living-plan by 0.04 m, so the parent reservation was corrected to X=[−2.89,−1.95] m. The other ten doors consume their room owners' hinge/opening decisions.
-->

Adopt reference 05's open room door as a hinged member. Its stopping angle is not measured from the photograph; follow room-specific swing reservations.

`hinge-pivot` is the vertical intersection of the hinge-jamb inner corner and opening-side wall face. [Settings openings](../settings/10-house.md#openings) require an open reference state; this model chooses π/2 rad. The motion interface is one rotation from closed 0 to reference-open π/2 rad. Below, low/high denote lower/higher ends along each opening's increasing coordinate axis. Opening directions are world planar axes, following [room owners](../spaces/05-route-network.md#room-route-network). With opening-side wall as local origin plane, opening is always local +Z.

| Door id | Hinge end | World opening | Open-face handle projection (m) | Space owner |
|---|---|---|---|---|
| `hall-bedroom-three-door` | low Z | +X | 0.056 | [Bedroom three](../spaces/rooms/bedroom-three.md#bedroom-three-plan) |
| `hall-bedroom-two-door` | high X | +Z | 0.056 | [Bedroom two](../spaces/rooms/bedroom-two.md#bedroom-two-plan) |
| `service-laundry-door` | low Z | +X | 0 | [Laundry](../spaces/rooms/laundry.md#laundry-plan) |
| `entry-living-door` | low Z | −X | 0.056 | [Living room](../spaces/rooms/living.md#living-plan) |
| `service-pantry-door` | high Z | +X | 0 | [Pantry](../spaces/rooms/pantry.md#pantry-plan) |
| `service-powder-door` | low Z | +X | 0.056 | [Powder room](../spaces/rooms/powder.md#powder-plan) |
| `hall-primary-door` | low X | −Z | 0.056 | [Primary bedroom](../spaces/rooms/primary.md#primary-plan) |
| `hall-shower-door` | low X | −Z | 0.056 | [Shower bathroom](../spaces/rooms/shower-bath.md#shower-bath-plan) |
| `hall-tub-door` | high Z | +X | 0.056 | [Tub bathroom](../spaces/rooms/tub-bath.md#tub-bath-plan) |
| `primary-wardrobe-door` | low Z | −X | 0.030 | [Opening-side primary bedroom](../spaces/rooms/primary.md#primary-plan) |
| `laundry-garage-door` | low Z | −X | 0 | [Laundry](../spaces/rooms/laundry.md#laundry-plan) |

The model has only two mirrored variants, hinge side local -X or +X. Opening-side wall as origin plane makes opening always local +Z. The source owner is `src/models/interior-door.ts`; inspect each room threshold view for open-leaf intrusion into the room owner's door-front clearance.

## Interior-door surface partitions {#interior-door-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns surface ids jamb-a/b/core·casing-a/b·leaf·leaf-panel·handle·hinge, separate jamb/casing faces for A/B walls and cut-end UVs.
@evidence principles/core/common.md#substantive-completion It separates jamb/casing because room finishes differ on both sides, while retaining a shared leaf surface.
@evidence principles/core/common.md#declared-basis jamb·casing·leaf·leaf-panel·handle·hinge id rules come from 00-model-frame.md#model-surface-partition-naming.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns common id rules into separation of the two interior-door wall faces.
@evidence principles/design/models.md#representation-contract It defines stable interior-door surface ownership.
@evidence principles/design/models.md#spatial-convention jamb-a/-b and casing-a/-b attach to interior-door-members nodes without new coordinates.
@evidence principles/design/models.md#reviewable-structure Both casing boundaries in the material-binding view can falsify it.
@evidence principles/design/models.md#model-observable-style-basis References 04·05 distinguish white leaves, reveals and black handles, so these faces are separated. Materials own white casing color; this H2 defines only boundaries.
@evidence principles/design/models.md#model-scale-layer-completion It defines surface interfaces for every interior-door member.
@evidence spaces/07-boundary-assembly.md#interior-boundary-ownership It consumes both room interfaces of one wall as separate model jamb-a·jamb-b and casing-a·casing-b faces.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work It directly consumed 00's naming rules and room-owner two-sided finish assignments for interior-door -a/-b separation; no parent revision was needed.
-->

References 04·05 distinguish white leaves, reveals and black handles, so separate those faces. Do not paste wood-grain photographs onto surfaces.

Stable ids derive from [naming rules](00-model-frame.md#model-surface-partition-naming): `jamb`, `casing`, `leaf`, `leaf-panel`, `handle`, `hinge`. Room A is the opening side and B the opposite side. Outer jamb faces meeting the two wall faces are `jamb-a`·`jamb-b`; opening-inner side/head reveals between them are `jamb-core`. All front/back/cut faces of separate A/B casing are `casing-a`·`casing-b`. Both broad leaf faces and top/bottom/side thickness faces are `leaf`; panel recess floors/four reveals are `leaf-panel`; hardware is `handle`·`hinge`. Do not overlap two ids on one complete face. Leaf/casing UV origins are each board's lower-left, with local X width/Y height in meters; reproject cut ends using longitudinal U/thickness V. The source owner is `src/models/interior-door.ts`.

For `jamb-a`·`jamb-b`·`jamb-core`, use each vertical jamb's bottom and head jamb's left end as origin, with member length U/width V at 1 UV/m. `casing-a`·`casing-b` likewise project each room's vertical/head boards with separate length U. `hinge` knuckles and `handle` plates/rods start actual circumference U/axial length V at each part's local +Z front seam; break seams at plate-to-cylinder transitions. Apply common UV rules to every end/back face.

Cylindrical walls cut into jambs/leaves for hinges also receive their body id from `jamb-a`·`jamb-core`·`leaf`. Their U is actual arc length from the hinge's local +Z seam and V is height from that hinge's lower Y end, at 1 UV/m. Project hinge-cylinder top/bottom caps in center-relative X/Z meter coordinates; break seams between the three hinges.

In the material-binding view, observe an open door from both rooms and inspect separate boundaries of `casing-a/b`, jamb fronts/reveals, leaves/panels and hardware. Actual model meshes and bindings are unverified.

## Interior-door representation limits {#interior-door-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation This H2 limits hinges to the three knuckles defined by the member H2 and excludes latches/locks/closers and interior thresholds.
@evidence principles/core/common.md#substantive-completion The 0.15 m garage step is resolved by the laundry owner's floor datum rather than a threshold model.
@evidence principles/core/common.md#declared-basis The ceiling comes from 00-model-frame.md#model-representation-ceiling; the step comes from spaces/rooms/laundry.md#laundry-plan.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the common ceiling into an interior-door mechanism omission list.
@evidence principles/design/models.md#representation-contract It defines observations unsupported by the interior-door proxy.
@evidence principles/design/models.md#spatial-convention Knuckle heights follow linked interior-door-members dimensions; this limit H2 introduces no coordinates.
@evidence principles/design/models.md#reviewable-structure Threshold observation can falsify threshold presence and hinge representation.
@evidence principles/design/models.md#model-observable-style-basis It states observable mechanism-omission limits.
@evidence principles/design/models.md#model-scale-layer-completion It explicitly excludes interior latches/locks/closers and thresholds.
@evidence obligations/design/models.md#representation-ceiling It specifies omissions of latches/locks/closers for interior doors.
@evidence spaces/rooms/laundry.md#laundry-plan The 0.15 m garage-floor step is consumed as the laundry floor datum without a separate modeled threshold.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The laundry threshold datum was consumed unchanged; no parent revision was needed.
-->

Adopt only the leaf panels and handles in reference 05 as geometry targets. Internal cores, hinge screws and door closers add no visible function and are excluded.

Within the [representation ceiling](00-model-frame.md#model-representation-ceiling), create hinges only as the three cylindrical knuckles specified by [shared interior-door members](#interior-door-members); omit latches, locks and closers. Interior doors have no threshold; the floor resolves the 0.15 m garage step using the threshold datum received by the [laundry owner](../spaces/rooms/laundry.md#laundry-plan). Inspection addresses are the [model-review view list](00-model-frame.md#model-review-set) and each room's threshold observation. Actual renders are unverified.
