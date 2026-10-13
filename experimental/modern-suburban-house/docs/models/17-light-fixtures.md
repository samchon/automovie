# Light-fixture body prototypes

## Flush ceiling fixture {#flush-ceiling-fixture}
<!--
@evidence principles/core/common.md#scope-preservation Owns one body prototype and its garage-diameter variant for ground/upper/garage ceilings, leaving light count, intensity and positions to systems and instances.
@evidence principles/core/common.md#substantive-completion Defines standard diameter 0.24 m, garage diameter 0.40 m, downward projection 0.05 m, abutment of ring Y=[−0.05,−0.020] m and connecting plate Y=[−0.020,−0.015] m, diffuser thickness, face ids and UVs.
@evidence principles/core/common.md#declared-basis Checks the 18 ceiling-fixture roles whose geometry is assigned to models by systems/02-interior-fixtures.md#interior-ground-ceiling and related units, together with spaces ceiling faces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Separates shallow residential interior lights and larger garage-light diameters under one assembly rule.
@evidence principles/design/models.md#representation-contract Creates a closed 16-sided housing ring, inner diffuser and ceiling-contact plate, covering every face with `fixture-housing`/`fixture-diffuser`. Light and internal wiring are not made.
@evidence principles/design/models.md#spatial-convention Local origin is the ceiling-contact center, +Y is up and +Z is room front. The fixture projects only downward; instances owns world placement.
@evidence principles/design/models.md#reviewable-structure Fixed side view inspects 0.05 m projection and both diameters; placement in rooms/garage adds ceiling-contact and headroom checks. Actual frames remain unverified.
@evidence principles/design/models.md#model-observable-style-basis Adopts shallow ceiling fixtures from reference 04's entry and 05's upper corridor. A thin housing ring and separate diffuser make an actual fixture rather than a dark ceiling hole; materials/systems owns optics.
@evidence principles/design/models.md#model-scale-layer-completion Settles two diameters, thickness, 16-sided segmentation, every face id, metre UVs, origin and section inspection.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes ceiling faces and lighting allocation unchanged without revising ceiling/room boundaries for fixture thickness.
@evidence settings/10-house.md#garage Consumes completion of an actual interior ceiling even in an empty garage to provide a diameter 0.40 m ceiling-fixture variant. Fixture allocation follows the systems handoff.
@evidence obligations/design/models.md#addressable-model-decisions Keeps flush ceiling fixtures separate from hanging lights so sizes/faces can change independently.
@evidence obligations/design/models.md#model-review-set Inspects plate thickness and diffuser faces in 00's fixed front, side and 45° views.
-->

Adopt shallow ceiling fixtures from reference 04's entry and 05's upper corridor. Systems determines per-room light output rather than fixture bodies.

The flush ceiling fixture is a prototype handed off by [interior-lighting allocation](../systems/02-interior-fixtures.md#interior-ground-ceiling). Subsequent placement owns population/position and systems owns light color/intensity. Standard rooms use diameter D = 0.24 m and the garage D = 0.40 m. Local origin is the ceiling-contact center, +Y points above the ceiling and +Z is room front; the entire fixture lies within Y = [-0.05, 0] m. The ceiling-contact plate has diameter 0.70D/thickness 0.008 m at Y = [-0.008, 0] m; the 16-sided housing ring has outer diameter D, inner diameter D − 0.04 m and height 0.030 m at Y = [-0.05, -0.020] m. A 16-sided connecting plate of outer diameter D/thickness 0.005 m abuts the ring top with its underside Y = -0.020 m and top Y = -0.015 m. A 16-sided neck of diameter 0.70D continues between connecting/contact plates at Y = [-0.015, -0.008] m, so all members meet at faces without overlapping closed volumes. The diffuser is a 16-sided disc matching the inner diameter, thickness 0.012 m at Y = [-0.05, -0.038] m, level with the ring underside. Every closed contact-plate, neck and ring face has `fixture-housing`; the diffuser has `fixture-diffuser`. Top/bottom UVs use local X/Z and vertical faces use circumference U/height V in metres. Systems places the light inside the fixture center; wiring and optical radiation are not claims of this mesh. The source owner is `src/models/lighting-fixtures.ts`. Side [fixed views](00-model-frame.md#model-review-set) and interior observations check plate/ceiling contact. Actual renders remain unverified.

## Island and dining pendants {#pendant-fixtures}
<!--
@evidence principles/core/common.md#scope-preservation Owns different shade prototypes for two island fixtures and one dining fixture, leaving lights, placement and cord repetition to systems/instances.
@evidence principles/core/common.md#substantive-completion Defines island outer diameter 0.28 m/drop 0.80 m, dining outer diameter 0.48 m/drop 1.20 m, canopy/cord/shade dimensions, and diffuser inner diameters 0.264/0.464 m and depths abutting shade lips.
@evidence principles/core/common.md#declared-basis Compares spaces' island/dining tops with systems/02-interior-fixtures.md#interior-common-pendants's light roles and shade bounds.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Separates two small island bells and one wide dining cylinder to give reference 03's two lighting zones distinct geometry.
@evidence principles/design/models.md#representation-contract Provides 16-sided canopies, closed suspension cords, thick shades and inner diffusers, partitioning faces into `fixture-canopy`, `fixture-stem`, `fixture-shade` and `fixture-diffuser`.
@evidence principles/design/models.md#spatial-convention Origin is the ceiling-contact center, +Y up and +Z use-facing. Drops measure downward from the origin without stored world coordinates.
@evidence principles/design/models.md#reviewable-structure Fixed side views inspect bell/cylinder shade drops and cord connections; placed views check two island/one dining fixtures and tabletop noninterference.
@evidence principles/design/models.md#model-observable-style-basis Defines numerical radius profiles for bell/cylindrical shades while leaving color/transmission to materials.
@evidence principles/design/models.md#model-scale-layer-completion Defines every radius, height, section, id, UV, origin and inspection address for both variants.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes countertop reservations/ceiling heights and keeps shade diameters within their respective tops, requiring no parent-space revision.
@evidence settings/10-house.md#common-room Distinguishes common-area kitchen and dining through fixture geometry.
@evidence spaces/rooms/common.md#common-island-reservation Keeps island shade outer diameter 0.28 m within island width 1.05 m.
@evidence spaces/rooms/common.md#common-dining-reservation Keeps dining shade outer diameter 0.48 m within tabletop width 0.90 m.
@evidence obligations/design/models.md#addressable-model-decisions Defines both shade profiles in a prototype H2 separate from flush ceiling fixtures.
@evidence obligations/design/models.md#model-review-set Inspects shade depth and cord connections in 00's front, side and 45° views.
-->

[Rear common-area settings](../settings/10-house.md#common-room) distinguishes kitchen/dining functions through lighting. Adopt reference 03's two small island lights and one wide dining light; this H2 owns only those two fixture geometries. Origin is the ceiling-contact center, +Y up. The island bell drops 0.80 m from ceiling to shade bottom with outer diameter 0.28 m. The dining cylinder drops 1.20 m with outer diameter 0.48 m. Both canopies have diameter 0.10 m/thickness 0.025 m, and cords are closed diameter 0.012 m cylinders. The island shade is a bell shell with three 16-sided rings of radii 0.14, 0.12 and 0.055 m, respectively at its bottom and 0.10/0.22 m above it, thickness 0.008 m. The dining shade is a 16-sided cylindrical shell of radius 0.24 m/height 0.20 m with a thickness 0.008 m diffuser disc below. Shade tops, bottoms and thickness faces close under `fixture-shade`, canopies use `fixture-canopy`, cords `fixture-stem`, and diffusers `fixture-diffuser`. Face UVs use planar X/Z or circumference U/height V in metres. Dining shade bottom is 0.80 m above its tabletop and island shade bottom 1.04 m above its top, separated from seated headroom. Instances/systems owns placement/lights. The source owner is `src/models/lighting-fixtures.ts`; actual occupancy and lighting frames remain unverified.
The island bell's `fixture-diffuser` is a 16-sided disc matching lower-rim inner diameter 0.264 m, placed on a plane 0.008 m above the lower lip's top, with thickness 0.006 m extending into the shade. Its perimeter meets the inner shade face only at a surface contact while retaining the shade's bottom opening. The dining diffuser similarly abuts the inside of its lower rim with inner diameter 0.464 m/thickness 0.008 m.

Canopy underside is local Y=−0.025 m. The island shade's upper rim is Y=−0.58 m and the dining shade's Y=−1.00 m, so exposed `fixture-stem` axial intervals are Y=[−0.58,−0.025] m and [−1.00,−0.025] m respectively. Cord bottoms abut the central hole in each shade's upper rim, without another cord piece inside the shade. `fixture-shade` covers the cut face of the diameter 0.012 m hole inside the upper rim.

Side [fixed model views](00-model-frame.md#model-review-set) inspect both drops and cord/shade joints. After common-area placement, front view distinguishes two island lights and one dining light and checks nonoverlap with tabletop outlines/use space. Actual GPU judgment remains unverified.

## Wall fixture above vanity mirrors {#vanity-wall-fixture}
<!--
@evidence principles/core/common.md#scope-preservation Owns one wall-fixture body prototype above mirrors in three sanitary rooms, leaving light and per-room locations to systems/instances.
@evidence principles/core/common.md#substantive-completion Defines width 0.36 m, height 0.06 m, wall projection 0.08 m, support/diffuser face ids, and diffuser X=[−0.155,0.155] m, axial depth 0.0575 m and diameter 0.045 m.
@evidence principles/core/common.md#declared-basis Uses settings' sanitary-room lighting requirement and spaces' empty wall above mirrors as grounds.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Uses one short horizontal above-mirror prototype in each room, distinct from bedroom ceiling and bedside lights.
@evidence principles/design/models.md#representation-contract Creates a closed wall plate and forward diffuser bar, partitioning metal/diffuser ids without creating the light itself.
@evidence principles/design/models.md#spatial-convention Origin is the above-mirror wall-contact center, +Z roomward, +Y up and length along +X.
@evidence principles/design/models.md#reviewable-structure Fixed side view inspects 0.08 m projection; sanitary-room placement checks mirror-center alignment and face noncontact.
@evidence principles/design/models.md#model-observable-style-basis Adopts reference 02·05's bright bathroom mirror-top bands as vanity lights. A thin horizontal bar and small metal end supports read as above-mirror lighting.
@evidence principles/design/models.md#model-scale-layer-completion Defines width, height, projection, part partition, ids, UVs, origin and inspection views.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes mirror bands and projection within 0.10 m without changing sanitary-room walls or mirror positions.
@evidence settings/10-house.md#powder Provides the powder-room mirror-top light body.
@evidence settings/10-house.md#shower-bathroom Provides the shower-bathroom vanity light body.
@evidence settings/10-house.md#tub-bathroom Provides the tub-bathroom vanity light body.
@evidence obligations/design/models.md#addressable-model-decisions Defines above-mirror wall-light projection/faces in an independent H2.
@evidence obligations/design/models.md#model-review-set Compares 00's front/side/45° views and above-mirror room views.
-->

Adopt reference 02·05's bright bands above bathroom mirrors as vanity wall lights. Do not copy photographic light bloom into fixture geometry.

Three sanitary rooms use the same above-mirror wall-fixture prototype. Origin is wall-contact center, +Y up, +Z roomward and length along +X. The rear plate measures width 0.36 m, height 0.06 m and thickness 0.015 m; both end supports have width 0.025 m, height 0.06 m and forward projection 0.08 m; the diffuser bar between them has length 0.31 m/diameter 0.045 m. Overall wall projection 0.08 m is within the [0.10 m interior-fixture ceiling](../systems/02-interior-fixtures.md#interior-baths). Every metal plate/support face has `fixture-housing`, every diffuser-bar face `fixture-diffuser`, with length U/circumference V in metres. Systems owns light intensity/color and instances owns location. Front [fixed model view](00-model-frame.md#model-review-set) inspects support/diffuser left-right symmetry, and side view 0.08 m projection. Actual bathroom placement checks mirror-center alignment and noncontact with the mirror face. The source owner is `src/models/lighting-fixtures.ts`; mirror interference and actual frames remain unverified.
The above-mirror `fixture-diffuser` axis lies at wall-normal +Z=0.0575 m from the backplate center, along horizontal X=[−0.155,0.155] m. Diameter 0.045 m places its frontmost point at Z=0.080 m, with both ends meeting the supports' inner X ends at faces. End supports extend from plate front Z=0.015 m to axial depth without pushing their ends into the diffuser.

## Wall sconce beside the porch door {#porch-wall-sconce}
<!--
@evidence principles/core/common.md#scope-preservation Owns only the wall-sconce body beside the porch entry door, leaving daytime light state/location to systems/instances.
@evidence principles/core/common.md#substantive-completion Defines wall plate 0.10 × 0.18 m, shade upper/lower outer diameters 0.10/0.14 m and Y=[−0.16,0.04] m, neck length 0.045 m at Y=0.015 m with inner-shade engagement 0.010 m, frontmost point 0.17 m and three surface ids.
@evidence principles/core/common.md#declared-basis Receives the door-side fixture handoff from settings/10-house.md#porch-entry and systems/03-exterior-fixtures.md#exterior-porch-sconce.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Defines one door-side fixture's vertical plate and transparent shade without adding porch-ceiling or garage lights.
@evidence principles/design/models.md#representation-contract Creates distinct closed plate, short neck and shade volumes, covering all faces with `fixture-housing`, `fixture-stem` and `fixture-glass`.
@evidence principles/design/models.md#spatial-convention Origin is exterior-wall contact center, +Z toward the porch exterior and +Y up, with the leaf opening inside the wall.
@evidence principles/design/models.md#reviewable-structure Fixed front/side views inspect plate, neck and shade silhouettes and 0.17 m projection; porch placement checks door-frame noncontact and daytime off state.
@evidence principles/design/models.md#model-observable-style-basis A vertical metal plate and short neck carrying an 8-sided shade make reference 01's small entry wall sconce readable.
@evidence principles/design/models.md#model-scale-layer-completion Defines plate/neck/shade vertical and normal positions/dimensions, engagement 0.01 m, ids, UVs, origin and inspection views.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consumes porch effective depth and entry rough opening without revising porch or door for the sconce.
@evidence settings/10-house.md#porch-entry Provides one entry-side sconce body visible even with daytime light off.
@evidence obligations/design/models.md#addressable-model-decisions Defines a porch-sconce shade/glass surface distinct from vanity lights in this H2.
@evidence obligations/design/models.md#model-review-set Uses 00's front/side/45° views and porch views beside the entry door.
-->

Adopt reference 01's small black sconce to the left of the entry door. Systems owns light inside the shade and dusk brightness; the fixture prototype owns only actual thickness/projection.

The door-side sconce of [porch settings](../settings/10-house.md#porch-entry) retains its fixture geometry even with daytime light off. Local origin is exterior-wall contact center, +Y up and +Z toward the porch. The wall plate measures width 0.10 m, height 0.18 m and thickness 0.015 m at Y=[−0.09,0.09], Z=[0,0.015] m. The forward diameter 0.025 m neck has axis Y=0.015 m and extends length 0.045 m from plate front Z=0.015 m to shade interior Z=0.060 m. The 8-sided truncated-cone shade has center axis Z=0.10 m, upper rim Y=0.04 m/diameter 0.10 m and lower rim Y=−0.16 m/diameter 0.14 m. Upper-rim rear point Z=0.050 m gives neck engagement 0.010 m inside the shade; neck top Y=0.0275 m is below upper rim Y=0.04 m, leaving no suspended gap between plate and shade. Lower-rim front point Z=0.10+0.07=0.17 m is the overall maximum forward projection. Every plate face has `fixture-housing`, neck `fixture-stem` and shade `fixture-glass`, with planar X/Y or circumference U/height V UVs in metres. The door opens inside without overlapping the fixture. Systems/instances owns light reference state/location. The source owner is `src/models/lighting-fixtures.ts`; actual porch captures remain unverified.

Front/side [fixed model views](00-model-frame.md#model-review-set) inspect plate, neck and shade outlines and 0.17 m projection. After actual porch placement, check door-frame noncontact and silhouette with daytime light off.
