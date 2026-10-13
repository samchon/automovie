# Small room props

## Books, tray and vase on the low table {#living-tabletop-props}
<!--
@evidence principles/core/common.md#scope-preservation Owns only props on 11's low table without recreating its top or legs.
@evidence principles/core/common.md#substantive-completion Defines two books, one tray and one vase, their outlines and three flower stems. Defines stem spacing 120°, starting radius 0.015 m and flower-cluster contacts.
@evidence principles/core/common.md#declared-basis Adopts books, tray and flowers on reference 04's coffee table, fitting them within 11's top.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds a small number of objects to the low wooden table's empty top as parts separate from furniture itself.
@evidence principles/design/models.md#representation-contract Partitions closed books, tray, vase, stems and flower clusters into `book`, `tray`, `container`, `stem` and `foliage`.
@evidence principles/design/models.md#spatial-convention Each origin is its host-top contact center, +Y is up, and instances owns placement yaw/location.
@evidence principles/design/models.md#reviewable-structure Inspects prototype 45° silhouettes first, then bounds in the placed tabletop plan and whether flowers obstruct seated living-room sightlines.
@evidence principles/design/models.md#model-observable-style-basis Different heights of thin books, shallow tray and small vase form reference 04's in-use table silhouette.
@evidence principles/design/models.md#model-scale-layer-completion Settles prop counts, dimensions, contacts, surface ids, UVs and inspection views.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Individual prop outlines fit the received tabletop dimensions without a parent size change; actual grouped placement, containment and sightline review remain unfinished rather than proving every object is already placed.
@evidence settings/10-house.md#living Makes 04's low table read with household props.
@evidence obligations/design/models.md#addressable-model-decisions Owns table structure and props in different H2s.
@evidence obligations/design/models.md#model-review-set Compares 00's front/side/45° views and 04's living-room view.
-->

Reference 04's low table holds books, a tray and flowers. Use the [low-table](11-living.md#low-table) top as host; the two books each measure 0.22 × 0.16 × 0.025 m, the tray 0.24 × 0.18 × 0.025 m, and the vase lower diameter 0.08 m, upper diameter 0.06 m and height 0.12 m. The vase contains three diameter 0.004 m/length 0.12 m stems, each ending in one of three closed diameter 0.04 m flower clusters. Overall height is at most 0.28 m above the top without obstructing seated sightlines. Every book face has `book`, tray `tray`, vase `container`, stems `stem`, and flower clusters `foliage`. UVs use plate width/height or circumference/height in metres. Prop origins are tabletop-contact centers with +Y up; instances determines actual placement coordinates for the selected 1.30 × 0.50 m or 1.05 × 0.55 m host top. Lettering and individual petals are not represented. Reference 04's separate table beside the armchair is not adopted because the [living-room reservation](../spaces/rooms/living.md#living-furniture-use) has no separate 0.40 m box clear of the main passage band, chair use and bookcase-access zones. This refusal does not remove 04's central coffee-table prototype. The source owner is `src/models/furnishings/props.ts`; actual interference and frames remain unverified.
The three table-flower stems start at horizontal radius 0.015 m and azimuths 0·120·240° around the vase-opening center, with each end 0.12 m above that opening. Each diameter 0.04 m flower-cluster center is 0.02 m above its stem end, abutting the stem's end face through surface contact only.

The 45° oblique [fixed model view](00-model-frame.md#model-review-set) inspects distinct book/tray/vase silhouettes, and side view inspects flower-cluster height. After actual table placement, inspect containment within the tabletop outline and whether it obstructs seated sightlines in [living-room observations](../spaces/04-observations.md#spatial-observation-derivation). Actual placement and GPU judgment remain unverified.

## Wall art and a small tabletop plant {#wall-art-indoor-plant}
<!--
@evidence principles/core/common.md#scope-preservation Owns only pictures hung on existing walls and plants on already reserved furniture tops, without creating wall/furniture faces.
@evidence principles/core/common.md#substantive-completion Defines two frame outlines, print-panel forward depth, planter/stem/crown sizes and surface parts.
@evidence principles/core/common.md#declared-basis Adopts reference 02–05 pictures and 04·05 planters, requiring host bindings clear of room windows, doors and passage.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds only wall-art and indoor-plant faces while preserving interior topology and reserved-furniture surface ownership.
@evidence principles/design/models.md#representation-contract Covers every closed frame face with `art-frame`/`art-print` and planter face with `container`/`stem`/`foliage`.
@evidence principles/design/models.md#spatial-convention Frame origin is the wall-contact center and planter origin the furniture-top contact center; +Y is up and frame +Z points into the room.
@evidence principles/design/models.md#reviewable-structure Inspects frame side thickness and noncontact with casing/frames, plant tabletop grounding and access below windows.
@evidence principles/design/models.md#model-observable-style-basis Thin frames, separate prints and branched plant crowns distinguish rooms from empty boxes, leaving actual pictures and leaf patterns to materials.
@evidence principles/design/models.md#model-scale-layer-completion Defines both frame and plant dimensions, face ids, metre UVs, origins and inspection addresses.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Places pictures only on already closed walls and plants only on reserved tops, without changing spatial boundaries.
@evidence settings/10-house.md#living Provides picture/planter prototypes suited to living-room walls and bookcases.
@evidence settings/10-house.md#primary-bedroom Provides small wall decorations and tabletop plants for upper private rooms.
@evidence obligations/design/models.md#addressable-model-decisions Independently settles print/frame and plant-volume faces in this H2.
@evidence obligations/design/models.md#model-review-set Compares 00's side/front views and reference 02–05 interior views.
-->

Adopt wall pictures from references 02–05 and indoor plants from 04–05. Frame variants are small 0.50 × 0.35 m and large 0.60 × 0.40 m, with depth 0.025 m. The origin is the backboard's wall-contact center, +Y is up and +Z points into the room. Four closed frame strips of width 0.025 m/depth 0.025 m have `art-frame`, the print face 0.018 m in front of the backboard has `art-print`, and the backboard also has `art-frame`. Print UV origin is bottom-left (0,0), with horizontal U/vertical V in metres. Materials deterministically generates different picture content.

The tabletop plant's origin is the furniture-top contact center with +Y up. It comprises a container of lower diameter 0.14 m, lip diameter 0.18 m and height 0.17 m, three stems (diameter 0.012 m/length 0.22 m), and three closed foliage clusters (each diameter 0.16 m/height 0.16 m). Stems and clusters overlap by 0.03 m to connect, giving total height 0.17 + 0.22 + 0.16 − 0.03 = 0.52 m, within maximum height 0.55 m. Every closed face has one of `container`, `stem` and `foliage`, with circumference U/height V in metres. Instances derives positions on closed walls or already reserved bookcase, dresser and shelf tops without creating new floor occupancy. The source owner is `src/models/furnishings/props.ts`; actual wall bindings/renders remain unverified.

The frame's `art-print` panel subtracts 0.025 m framing on every side, giving small 0.45×0.30 m or large 0.55×0.35 m, thickness 0.002 m, with its lower face 0.018 m forward of the backboard.

Front [fixed model view](00-model-frame.md#model-review-set) inspects the frame/print, and side view the 0.025 m frame depth. Placed-room observations inspect frame noncontact with casing/window frames and plant tabletop grounding; actual GPU judgment remains unverified.

## Sofa throw cushions and blanket {#sofa-throws}
<!--
@evidence principles/core/common.md#scope-preservation Leaves three seat cushions and arm bodies with 11, owning only two throw cushions and one folded blanket.
@evidence principles/core/common.md#substantive-completion Defines two cushions each 0.42 × 0.42 × 0.10 m and blanket 0.65 × 0.45 × 0.025 m.
@evidence principles/core/common.md#declared-basis Adopts throw cushions/blankets from reference 02–04 sofas, binding them to 11's sofa seats.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds a textile layer over the basic sofa's three seat bays without changing seat count.
@evidence principles/design/models.md#representation-contract Creates two closed cushion volumes and folded blanket plates, with `pillow`/`folded` covering all faces.
@evidence principles/design/models.md#spatial-convention Origin is the sofa-seat contact, +Z is sofa front and +Y up, with world placement inherited from the host sofa.
@evidence principles/design/models.md#reviewable-structure Prototype views inspect two cushions and blanket plates; sofa-binding views distinguish structural seats from throws and check that the blanket stays within the arm outline.
@evidence principles/design/models.md#model-observable-style-basis Two different textile layers on the gray sofa add signs of use, with color/weave owned by materials.
@evidence principles/design/models.md#model-scale-layer-completion Defines count, outline, contact, ids, UVs and inspection addresses.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Props stay within the sofa outline without changing room reservations or passage.
@evidence settings/10-house.md#living Provides supplementary textiles on 04's fabric sofa.
@evidence settings/10-house.md#common-room Reuses the same prototype on the family-room sofa.
@evidence obligations/design/models.md#addressable-model-decisions Owns structural cushions and supplementary textiles in different H2s.
@evidence obligations/design/models.md#model-review-set Compares 00's front/side/45° views and 03·04 interior views.
-->

The blanket bounds below are measured in the host sofa's floor-based frame. For a prop transform whose origin is the seat-contact plane at sofa Y=0.43 m, subtract 0.43 m from every listed Y bound: the first plate is Y=[0.19,0.215] m relative to that prop origin. Do not add the seat height twice; X/Z retain the sofa-centered horizontal reference.

The sofas in references 02–04 show throw cushions and blankets in addition to the [structural prototype's three seat cushions](11-living.md#fabric-sofa). The two supplementary cushions are closed rounded-corner volumes, each 0.42 × 0.42 × 0.10 m, placed left/right in front of the backrest. The blanket, unfolded length 0.65 m, depth width 0.45 m and thickness 0.025 m, folds into five 0.13 m lengths on the sofa's right arm top. In sofa-centered local coordinates, all five folded plates occupy X=[0.92,1.05]·Z=[0.25,0.70] m and, from bottom i=0…4, Y=[0.62+0.025i,0.645+0.025i] m. Neighboring plates meet only at horizontal contacts and rest on `arm` top Y=0.62 m. The highest face Y=0.745 m is below the backrest top 0.90 m, and all plates remain within sofa outline X=1.05 m. Every cushion face has `pillow`; blanket sides and cut ends have `folded`. The origin is sofa-seat contact, +Y up and +Z front; UVs use unfolded blanket length U/depth V continuously across fold lines at 1 UV/m. Decorative tassels/wrinkles are not made. Front [fixed model view](00-model-frame.md#model-review-set) inspects two cushion silhouettes, and side view the five blanket plates' height. After actual sofa placement, front view distinguishes three structural seats from two throws, and side view checks that the blanket stays within arm outline X=1.05 m. The source owner is `src/models/furnishings/props.ts`; actual sofa bindings/renders remain unverified.
