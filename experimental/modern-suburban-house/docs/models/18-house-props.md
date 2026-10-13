# Household prop prototypes

## Porch mat and small planter {#porch-mat-planter}
<!--
@evidence principles/core/common.md#scope-preservation Owns one prototype each for the mat outside the entry door and the independent planter, without making porch floor, leaf or columns.
@evidence principles/core/common.md#substantive-completion Defines mat 0.60 × 0.40 × 0.008 m, planter diameter 0.28 m, five 0.19 m stems and five 0.25 m-high foliage clusters, deriving a top point approximately 0.7103 m within the total 0.72 m limit.
@evidence principles/core/common.md#declared-basis Settings/10-house.md#porch-entry supplies the door-front mat and small planter; spaces/porch.md#porch-platform-access distinguishes flat-floor mat covering on the approach axis from a standing planter outside its clear width.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adopts reference 01's small entry props as a low mat and rounded planter while preserving ownership of porch stairs and the door itself.
@evidence principles/design/models.md#representation-contract Emits closed mat `field`/`border` and planter `container`/`foliage`/`stem` parts. Actual soil and individual petals are not represented.
@evidence principles/design/models.md#spatial-convention Both mat and planter origins are their base centers, with +Y up. Instances reads porch reservations to decide world placement.
@evidence principles/design/models.md#reviewable-structure Porch front view inspects prop size without blocking door/stairs, and side view inspects mat height and planter grounding.
@evidence principles/design/models.md#model-observable-style-basis Separate volumes of the thin textile mat and rounded flared-lip planter add only signs of use to reference 01's entry.
@evidence principles/design/models.md#model-scale-layer-completion Defines each outline, parts, ids, UVs, origin and observation address, leaving only location to subsequent placement.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The corrected porch parent permits a thin door-front covering and confines the standing planter outside the 1.50 m entry width; 0.008 m mat thickness and 0.28 m planter diameter require no further structure or circulation change.
@evidence settings/10-house.md#porch-entry Provides prototypes for the entry-side mat and planter props.
@evidence spaces/porch.md#porch-platform-access Receives flat porch-floor support for the mat on the door approach and an outside-entry-width host for the standing planter; their base-centre origins leave actual positions to instances.
@evidence obligations/design/models.md#addressable-model-decisions Defines mat/planter geometry and faces in this H2, separate from the porch-structure owner.
@evidence obligations/design/models.md#model-review-set Compares 00's front/side/45° views with reference 01's exterior porch view.
-->

Adopt reference 01's mat above the entry steps and small planter beside the door. Check pedestrian clear width against the porch reservation.

[Entry-porch settings](../settings/10-house.md#porch-entry) requires a mat and small planter. Separate from the interior entry mat, the outside-door mat is 0.60 m long, 0.40 m wide and 0.008 m thick. Its origin is the base center with +Y up; `border` covers the 0.025 m perimeter and `field` the interior across every top, bottom and side face. The planter likewise uses a base-center origin and +Y up, with a 12-sided tapered body of lower diameter 0.20 m, lip diameter 0.28 m and container height 0.28 m, plus a 0.025 m-high lip ring. Inside, five stems of diameter 0.025 m/length 0.19 m and five closed foliage clusters at their ends, each diameter 0.12 m/height 0.25 m, spread at 72° intervals within total height 0.72 m. Stem i starts at (0, 0.28, 0) m above the container center and ends at horizontal radius 0.06 m, azimuth 72i° and height `0.28 + √(0.19² − 0.06²)` m. Foliage clusters extend 0.25 m upward from those ends, giving a highest point approximately 0.7103 m. Every container, stem and foliage-cluster face has `container`, `stem` and `foliage` respectively, with body circumference U/height V provided in metres. Soil, individual leaves and petals are not represented. Instances reads [porch entry width](../spaces/porch.md#porch-platform-access) to decide positions/rotations; intrusion into stairs or the leaf fails. The source owner is `src/models/furnishings/props.ts`; actual GPU frames remain unverified.

Front/side [fixed model views](00-model-frame.md#model-review-set) inspect mat/planter outlines and undersides. At actual porch placement, compare with reference 01 to check whether props obstruct the entry door or stair passage and whether their bases contact the floor. Actual placement and GPU judgment remain unverified.

## Kitchen and dining-table food and utensils {#kitchen-food-utensils}
<!--
@evidence principles/core/common.md#scope-preservation Owns prototypes for a small amount of countertop food/utensils and the dining-table fruit bowl, leaving cabinet, sink and appliance prototypes in 10.
@evidence principles/core/common.md#substantive-completion Defines cutting board, utensil holder, five utensils, sealed container, fruit bowl and five fruit volumes; four fruits lie on radius 0.08 m and the fifth centrally, with center separation 0.08 m greater than maximum radius sum 0.0775 m. Defines spatula/spoon/whisk head width, length, thickness and rod-end joints.
@evidence principles/core/common.md#declared-basis Chooses from settings/10-house.md#kitchen-equipment's unobstructive food/utensils and reference 03's dining-table bowl.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Keeps the actual worktop usable through only a 0.35 m board and small holder, with one low fruit bowl at the dining-table center.
@evidence principles/design/models.md#representation-contract Partitions every closed board, holder, rod-utensil, bowl and fruit volume face into `cutting-board`, `container`, `utensil`, `bowl` and `fruit`.
@evidence principles/design/models.md#spatial-convention Each origin is the supporting tabletop-contact center; +Y is up and +Z the user-facing front. Instances calculates world placement from host tops.
@evidence principles/design/models.md#reviewable-structure Fixed top/side views inspect utensil tips and low bowl/fruit outlines, followed by tabletop-placement checks for sink/cooktop/dining-seat noninterference.
@evidence principles/design/models.md#model-observable-style-basis The five utensils' different tips and five rounded fruits in the bowl distinguish them from an empty countertop; materials owns color.
@evidence principles/design/models.md#model-scale-layer-completion Defines every part dimension/count, contact, face id, UV and inspection view.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes 10's countertop dimensions and common-area routes without requiring a new faucet or cabinet.
@evidence settings/10-house.md#kitchen-equipment Places utensils and some food on worktops without obscuring dishwasher or sink.
@evidence settings/10-house.md#common-room Adopts reference 03's dining-table fruit bowl as a low tabletop prop rather than furniture.
@evidence obligations/design/models.md#addressable-model-decisions Separates food props and countertop members into distinct H2s to track population and occupancy.
@evidence obligations/design/models.md#model-review-set Inspects in 00's top/front/side views and reference 03's common-area view.
-->

[Kitchen-equipment settings](../settings/10-house.md#kitchen-equipment) requires some food and cooking utensils. Each model's origin is its tabletop-contact center, +Y is up and +Z the user-facing front. The cutting board is a rounded-corner 0.35 × 0.25 × 0.02 m plate, and the holder an open 12-sided container of lower diameter 0.10 m, upper diameter 0.12 m and height 0.18 m. Five utensils attach two flat spatulas of tip width 0.03 m, two diameter 0.035 m spoons and one diameter 0.04 m whisk to rods of diameter 0.012 m/length 0.25 m, with each tip within overall prototype height 0.38 m. One small food jar measures 0.12 × 0.12 × 0.20 m and reuses the same volume prototype as [pantry containers](12-service-rooms.md#pantry-containers). Instances places board, holder, utensils and jar at host-top coordinates that do not obscure sink, cooktop or wall-kitchen preparation area.
Relative to rod-end Y=0.25 m, the two spatula heads are rounded plates of X width 0.03 m, Y length 0.06 m and thickness 0.004 m; the two spoon heads are oval dishes of diameter 0.035 m/thickness 0.006 m; and the whisk is an 8-sided wire loop of diameter 0.04 m/Y length 0.08 m. Head undersides abut rod ends, and maximum height 0.33 m remains within the overall 0.38 m limit when stood with the 0.18 m holder.

The dining table receives one open 16-sided bowl of outer diameter 0.28 m, height 0.075 m and wall thickness 0.008 m, with five fruits as closed 12-sided ellipsoids of diameter `0.06 + 0.005i` m for indices i = 0…4. Fruit centers i = 0…3 lie at 90i° on a radius 0.08 m circle around the bowl center; only i = 4 is exactly central. Center separation 0.08 m exceeds the sum 0.0775 m of the largest perimeter-fruit radius 0.0375 m and central-fruit radius 0.04 m, preventing overlap. Surface ids are `cutting-board` for the board, `container` for holder/jar, `utensil` for utensils, `bowl` for the bowl and `fruit` for fruits. Every closed face has exactly one id, with X/Z UVs on planes and circumference U/height V in metres on sides. Adopt reference 03's dining-table fruit bowl without a second faucet or excessive food display under the [settings adoption scope](../settings/10-house.md#kitchen-equipment). The source owner is `src/models/furnishings/props.ts`; actual tabletop occupancy and frames remain unverified.

Top/side [fixed model views](00-model-frame.md#model-review-set) inspect the five utensil tips and low bowl/fruit outlines. Once placed on actual kitchen and dining tops, check whether they obstruct sink, cooktop or seat-use areas.

## Folded linen-closet towels {#linen-folded-towels}
<!--
@evidence principles/core/common.md#scope-preservation Owns only folded towels on linen shelves, leaving shelves and leaves with the 05 prototype.
@evidence principles/core/common.md#substantive-completion Defines dimensions/spacing for three stacks across each of five shelves, two towels per stack, totaling 30 towels.
@evidence principles/core/common.md#declared-basis Consumes settings/10-house.md#storage's folded-towel shelves and the five shelves/depth of models/05-closet-fittings.md#linen-closet-fittings.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Fills empty linen shelves with three stacks of folded textiles without duplicating sliding doors or shelf bodies.
@evidence principles/design/models.md#representation-contract Covers 30 closed slightly rounded textile volumes with one `folded` id, without representing threads or individual fibers.
@evidence principles/design/models.md#spatial-convention Each stack origin is the shelf-top rear center, +Y up and +Z toward the door. Placement supplies shelf tops.
@evidence principles/design/models.md#reviewable-structure Open-door front view checks towels on five levels; side view checks fabric does not overlap door tracks.
@evidence principles/design/models.md#model-observable-style-basis Adopts folded textiles visible in reference 05's bathroom/corridor storage as linen-closet towel stacks. Repeated white stacks distinguish their storage role from food-container pantry storage; materials owns actual weave.
@evidence principles/design/models.md#model-scale-layer-completion Defines counts, dimensions, placement formulas, surface id, UVs, local frame and inspection addresses.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes upper linen-closet shelf depth 0.55 m and five tops unchanged, with no parent revision.
@evidence settings/10-house.md#storage Provides folded-towel prototypes for the linen closet near the landing.
@evidence spaces/rooms/upper-hall.md#upper-linen-storage Consumes the corridor-storage binding to five shelves and direct door access.
@evidence obligations/design/models.md#addressable-model-decisions Keeps towel prototypes in an H2 separate from 05's shelf members to track materials/population independently.
@evidence obligations/design/models.md#model-review-set Inspects in 00's front/side/45° views and the upper-corridor threshold view.
-->

Adopt folded textiles visible in reference 05's bathroom/corridor storage as linen-closet towel stacks. Folded-stack population derives from shelf length rather than counting photographs.

The folded towels of [storage settings](../settings/10-house.md#storage) are subsequent props on the [five linen-closet shelves](05-closet-fittings.md#linen-closet-fittings). Each stack's origin is the rear center of its shelf top, +Y is up and +Z toward the door. One towel's outline is width 0.28 m, depth 0.32 m and height 0.06 m. Two towels stack to height 0.12 m; each shelf holds three stacks separated horizontally by 0.02 m. Total width 3 × 0.28 + 2 × 0.02 = 0.88 m leaves 0.16 m at each end of a 1.20 m shelf. Starting 0.05 m from the rear and occupying depth 0.32 m leaves 0.18 m at the front of a 0.55 m shelf without projecting into the door track. Five shelves × three stacks × two towels = 30 towels. Every towel face has `folded`, with width U/depth V in metres. Folded corners round at radius 0.008 m, with no separate seam/fiber mesh. Instances reads shelf-prototype tops and open-door state to calculate positions. The source owner is `src/models/furnishings/props.ts`; actual storage frames remain unverified.

Front/side [fixed model views](00-model-frame.md#model-review-set) inspect stack layers and outlines. After placement in the actual linen closet, open-door front view checks stacks on all five shelves. Side view distinguishes the 0.18 m shelf-front margin from the gap to the nearest closed rear leaf: towel front Z=−3.03 m, shelf front Z=−3.21 m and rear-leaf back Z=−3.33 m leave 0.30 m to that leaf. Tracks and moving leaves retain their own actual bounds for contact review. Actual shelf contact and GPU judgment remain unverified.
