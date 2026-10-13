# Interior fixtures

## Common-area island pendants and dining light {#interior-common-pendants}
<!--
@evidence models/17-light-fixtures.md#pendant-fixtures Island/dining shade diameter bounds 0.30/0.50 m and ceiling contacts constrain those two fixture prototypes. This H2 compares interior light points with countertop/route clearances without recreating stems or shade geometry.
@evidence materials/03-furnishings.md#towel-curtain-textile Pendant fixture-shade receives a light textile surface separate from structural metal. Warm point lights and material response remain distinct rather than covering shade surfaces with light color.
@evidence principles/core/common.md#scope-preservation Owns positions, shade-outline bounds, color, intensity and state for two island pendants and one dining light.
@evidence principles/core/common.md#substantive-completion Defines island X = -3.125, Z = -8.10·-7.05, Y = 1.95 m, dining X = 0.50, Z = -7.95, Y = 1.55 m, shade-diameter bounds 0.30/0.50 m, 2,700 K, 6/9 cd, range 4.0 m and on state.
@evidence principles/core/common.md#declared-basis Receives lighting-based functional separation from common-room and derives coordinates from island/dining reservations, identifying intensities as branch choices.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds three suspended lights' coordinates, heights and shade bounds beyond common-room's furniture/lighting functional separation.
@evidence principles/design/systems.md#system-authority-confinement Writes only lights; models owns shade/cord geometry and instances consumes these coordinates for placement.
@evidence principles/design/systems.md#system-dependency-basis Derives coordinates from common-island-reservation/common-dining-reservation centers and noncollision by comparing stool occupancy/common-clear-routes.
@evidence principles/design/systems.md#system-verification-address Falsifying observations compare 03's two light pools and whether shade outlines extend outside island/tabletop or overlap route reservations.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared common-room and island/dining/route reservations against suspended shade bounds; all fit within their bodies without a defect requiring parent-reservation revision.
@evidence settings/10-house.md#common-room Realizes the decision to separate kitchen, dining and family areas through furniture/lighting as island pendants and a dining light.
@evidence spaces/rooms/common.md#common-room-plan Uses kitchen-dining-family room id and outline as light affiliation.
@evidence spaces/rooms/common.md#common-island-reservation Derives pendant coordinates/shade bounds from island X = [-3.65, -2.60], Z = [-8.70, -6.45] and stool occupancy.
@evidence spaces/rooms/common.md#common-dining-reservation Places the dining light at the center of tabletop X = [-0.35, 1.35], Z = [-8.40, -7.50].
@evidence spaces/rooms/common.md#common-clear-routes Checks that shades do not hang over routes to the dining table's right/rear.
@evidence spaces/01-storeys.md#storey-datums Defines hanging heights below ground-floor ceiling 2.75 m.
@evidence obligations/core/common.md#purpose-fit 02-interior-fixtures.md owns per-room interior-fixture coordinates/states; without it, lit warm interior lights would be undecided in 16 interior spaces among the 17 spaces.
-->

The [common area](../spaces/rooms/common.md#common-room-plan) separates functions through furniture/lighting without full-height partitions, so two suspended-fixture kinds distinguish kitchen/dining zones. Island pendants are point lights `light:kitchen-dining-family:island-pendant-1`/`-2`, placed on the centerline of [island reservation](../spaces/rooms/common.md#common-island-reservation) X = [-3.65, -2.60], Z = [-8.70, -6.45] m, at X = -3.125 m, Z = -8.10·-7.05 m and emission height Y = 1.95 m. Dining light `light:kitchen-dining-family:dining-pendant` lies at the center of [dining top](../spaces/rooms/common.md#common-dining-reservation) X = [-0.35, 1.35], Z = [-8.40, -7.50] m: X = 0.50 m, Z = -7.95 m, Y = 1.55 m. The island shade's plan-diameter bound 0.30 m occupies X = [-3.275, -2.975] m within the island body, without hanging over stool-use occupancy (from island east edge to X = -1.65 m) or the west work route (X < -3.65 m). Dining-shade diameter bound 0.50 m occupies X = [0.25, 0.75], Z = [-8.20, -7.70] m within the top, without intruding into headroom of [common routes](../spaces/rooms/common.md#common-clear-routes) to the right/rear. All three lights use approximately 2,700 K (1.00, 0.72, 0.45), `range` 4.0 m and `intensity` 6 cd per island light/9 cd for dining, on in review frames. Intensities are branch choices for readable warm pools alongside window light under [fixed exposure](01-daylight.md#daylight-sky-fill). Models owns shade/cord geometry; instances consumes these placement coordinates.

The source owner is `src/systems/lighting.ts`. Original common-area views distinguish two island cone shades, the dining cylinder shade and their respective warm ceiling regions. A native falsification with dining-light intensity 0 removed only its region while island lights remained. Actual vertex bounds of all three shades lie within the island/dining tabletop reservations above without intruding into passage reservations. The dining-table body itself is an unbuilt object.

## Ceiling lights in ground-floor rooms and passages {#interior-ground-ceiling}
<!--
@evidence models/17-light-fixtures.md#flush-ceiling-fixture The fixture model owns the flush body's 0.05 m downward projection from finished ceiling. Ceiling 2.75 m and emission point 2.70 m align without systems duplicating the body.
@evidence principles/core/common.md#scope-preservation Owns eight ground-floor room/passage lights: living room, family area, entry, two service strips, powder room, laundry and pantry.
@evidence principles/core/common.md#substantive-completion Defines eight lights' X/Z in a table, Y = 2.70 m, 2,700 K, 7.5 cd, range 5.0 m and on state.
@evidence principles/core/common.md#declared-basis Identifies coordinates as derived from room-owner outline centers and service-room on states as following lighting-state's prohibition on dark rooms.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds per-room coordinates/on states beyond lighting-state's requirement for warm ceiling lights.
@evidence principles/design/systems.md#system-authority-confinement Writes only lights, receiving room outlines/ceiling datums from spaces owners.
@evidence principles/design/systems.md#system-dependency-basis Calculates each coordinate from cited room-outline values and storey-datums' 2.75 m.
@evidence principles/design/systems.md#system-verification-address Falsifying observations compare containment of each coordinate and brightness continuity in frame 04.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared eight room outlines and ground-floor ceiling datum with light coordinates; all lie within bounds without parent revision.
@evidence settings/20-verification.md#lighting-state Realizes lit warm ceiling fixtures and the dark-room prohibition through eight on lights.
@evidence spaces/01-storeys.md#storey-datums Derives emission Y = 2.70 m from ground-floor ceiling Y = 2.75 m.
@evidence spaces/rooms/living.md#living-plan Places the light at living-room outline center X = -3.725, Z = -3.15.
@evidence spaces/rooms/common.md#common-family-reservation Places it between the family area's low table and sofa at X = 3.95, Z = -7.80.
@evidence spaces/rooms/entry.md#entry-plan Places it at the center of front-entry's L-shaped X = [-0.50, 2.02] section.
@evidence spaces/rooms/service.md#service-access-plan Places one light at each of service-access's two strip centers.
@evidence spaces/rooms/powder.md#powder-plan Places it at powder-room outline center X = 4.36, Z = -1.075.
@evidence spaces/rooms/laundry.md#laundry-plan Places it at laundry-mudroom outline center X = 4.36, Z = -3.30.
@evidence spaces/rooms/pantry.md#pantry-plan Places it at pantry outline center X = 4.36, Z = -5.375.
-->

Ground-floor rooms use flush fixtures at the [finished ground-floor ceiling Y = 2.75 m](../spaces/01-storeys.md#storey-datums), with emission point Y = 2.70 m. They are not suspended, avoiding headroom collision with furniture/route reservations. Coordinates are plan centers derived from each room owner's finished inner outline or the functional centers below.

| Light id | Room owner | X, Z (m) | Basis |
| --- | --- | --- | --- |
| `light:living-room:ceiling` | [Living room](../spaces/rooms/living.md#living-plan) | -3.725, -3.15 | Center of X = [-5.50, -1.95], Z = [-6.05, -0.25] |
| `light:kitchen-dining-family:family-ceiling` | [Family-area reservation](../spaces/rooms/common.md#common-family-reservation) | 3.95, -7.80 | Authored functional point between low table X = [3.40, 4.45], Z = [-8.35, -7.80] and sofa front; not a recomputed table midpoint |
| `light:front-entry:ceiling` | [Entry](../spaces/rooms/entry.md#entry-plan) | 0.76, -1.83 | Center of L-shaped section X = [-0.50, 2.02], Z = [-3.41, -0.25], outside stair opening X = [-1.80, -0.65] |
| `light:service-access:right-strip` | [Service passage](../spaces/rooms/service.md#service-access-plan) | 2.545, -3.15 | Center of right strip X = [2.02, 3.07], Z = [-6.05, -0.25] |
| `light:service-access:rear-strip` | Same owner | 0.11, -5.38 | Center of rear-stair strip X = [-1.80, 2.02], Z = [-6.05, -4.71] |
| `light:powder-room:ceiling` | [Powder room](../spaces/rooms/powder.md#powder-plan) | 4.36, -1.075 | Center of X = [3.22, 5.50], Z = [-1.90, -0.25] |
| `light:laundry-mudroom:ceiling` | [Laundry/mudroom](../spaces/rooms/laundry.md#laundry-plan) | 4.36, -3.30 | Center of X = [3.22, 5.50], Z = [-4.55, -2.05] |
| `light:pantry:ceiling` | [Pantry](../spaces/rooms/pantry.md#pantry-plan) | 4.36, -5.375 | Center of X = [3.22, 5.50], Z = [-6.05, -4.70] |

All are point lights, approximately 2,700 K, `intensity` 7.5 cd, `range` 5.0 m, on in review frames. [Lighting and reference state](../settings/20-verification.md#lighting-state) prohibits hiding dark rooms through view-specific brightness, so storage/service spaces remain on. Room ids exactly match the spaces ids defined by their room owners.

The source owner is `src/systems/lighting.ts`. Actual X/Z/Y of the eight lights above were compared with their rooms' finished outlines/heights, with no out-of-bounds coordinates. Original whole-building views show continuous entry→living→kitchen connection and service-passage floors/walls/frames at the same exposure, with readable flush-fixture ceiling contacts. Directions showing only a close wall were compared with spatial views in other directions rather than using that single image as whole-room evidence.

## Ceiling lights over the stair and upper corridor {#interior-stair-hall}
<!--
@evidence principles/core/common.md#scope-preservation Owns ceiling lights above the intermediate stair landing and two upper-corridor sections.
@evidence principles/core/common.md#substantive-completion Defines landing X = -1.225, Z = -3.985, corridor X = -0.065, Z = -5.31 and X = 2.47, Z = -4.06, all at Y = 5.61 m, 7.5 cd and on.
@evidence principles/core/common.md#declared-basis Identifies coordinates as stair-reservation/upper-hall-plan outline centers, with heights derived from upper ceiling 5.66 m.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds three light coordinates and headroom comparisons beyond stair/upper-hall settings' route definitions.
@evidence principles/design/systems.md#system-authority-confinement Writes only lights, receiving stair route/corridor outlines from spaces.
@evidence principles/design/systems.md#system-dependency-basis Calculates clearance 4.25 m from intermediate landing Y = 1.36 m and ceiling 5.66 m.
@evidence principles/design/systems.md#system-verification-address Falsifying observations compare landing/corridor continuity in frame 05 and containment of coordinates.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared stair-reservation's landing, upper-hall outline and upper-ceiling datum, preserving headroom 2.00 m without parent revision.
@evidence spaces/02-stair.md#stair-reservation Places above landing center X = [-1.80, -0.65], Z = [-4.56, -3.41], Y = 1.36.
@evidence spaces/rooms/upper-hall.md#upper-hall-plan Places one light at each center of corridor arm/arrival outlines.
@evidence spaces/01-storeys.md#storey-datums Compares upper ceiling 5.66 m and headroom 2.00 m.
-->

The stair has flush `light:main-stair:landing-ceiling` above [intermediate landing](../spaces/02-stair.md#stair-reservation) X = [-1.80, -0.65], Z = [-4.56, -3.41] m (Y = 1.36 m), at the [finished upper ceiling Y = 5.66 m](../spaces/01-storeys.md#storey-datums): X = -1.225 m, Z = -3.985 m, Y = 5.61 m. It lies 4.25 m above the landing without intruding into [stair headroom 2.00 m](../spaces/01-storeys.md#storey-datums). The [upper corridor](../spaces/rooms/upper-hall.md#upper-hall-plan) has flush `light:upper-hall:arm-ceiling`/`light:upper-hall:arrival-ceiling` at Y = 5.61 m, respectively at arm center X = -0.065 m, Z = -5.31 m for X = [-3.20, 3.07], Z = [-5.91, -4.71] m, and arrival center X = 2.47 m, Z = -4.06 m for X = [1.87, 3.07], Z = [-4.71, -3.41] m. All are point lights, approximately 2,700 K, 7.5 cd, `range` 5.0 m and on.

The source owner is `src/systems/lighting.ts`. The landing light lies above its declared outline, and both corridor lights lie within their arm outlines. Original upper-floor views show two flush fixtures, corridor frames, treads and landing continuously at the same exposure. A native falsification setting upper ceiling lights to 0 removed warm ceiling/wall continuity. Current GPU targets after railing-junction revision also confirmed readability of both corridor arms and treads.

## Bedroom and dressing-room ceiling and bedside lights {#interior-bedrooms}
<!--
@evidence models/13-bedrooms.md#nightstand-lamp The four bedside-light heights consume this furniture host's declared shades and spaces' lamp-inclusive heights. Static house inputs contain no portable-lamp bodies, leaving actual shade-outline comparison unverified.
@evidence principles/core/common.md#scope-preservation Owns ceiling lights for three bedrooms/dressing room and four bedside lights.
@evidence principles/core/common.md#substantive-completion Defines four ceiling-light coordinates, bedside X/Z/Y (3.96/4.01 m), 2,700 K 7.5 cd and 2,400 K 1.2 cd, all on.
@evidence principles/core/common.md#declared-basis Bedside lamps come from primary-bedroom/bedroom-two/bedroom-three settings; heights are 0.15 m below spaces' lamp-inclusive heights. Design prototypes exist at models/13-bedrooms.md#nightstand-lamp and models/17-light-fixtures.md#flush-ceiling-fixture, while source bindings remain unverified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds light coordinates, heights and color temperatures beyond bedroom settings' bedside-table/light existence.
@evidence principles/design/systems.md#system-authority-confinement Writes only lights; models owns shades/bodies and instances consumes bedside placement.
@evidence principles/design/systems.md#system-dependency-basis Calculates coordinates from room outlines/bedside-reservation centers and heights from lamp-inclusive heights.
@evidence principles/design/systems.md#system-verification-address Falsifying observations include bedside-light readability in 02·05, height comparison with model shades and bounds containment.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared three bedroom settings and room/bedside reservations; every light lies within room bounds and above its bedside table without parent revision.
@evidence settings/10-house.md#primary-bedroom Realizes both bedside lights as two lamps.
@evidence settings/10-house.md#bedroom-two Realizes bedside table/light as one lamp.
@evidence settings/10-house.md#bedroom-three Realizes bedside table/light as one lamp.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-plan Places a ceiling light at outline center X = -3.725, Z = -2.405.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use Derives Y = 3.96 from bedside reservation and lamp-inclusive 1.05 m.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-plan Places it at front-rectangle center X = 2.50, Z = -1.38.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Places at bedside-reservation center X = 1.275, Z = -2.875.
@evidence spaces/rooms/primary.md#primary-plan Places at rear-body center X = -2.375, Z = -8.255.
@evidence spaces/rooms/primary.md#primary-furniture-use Derives Y = 4.01 from two bedsides Z = -8.90·-6.80 and lamp-inclusive 1.10 m.
@evidence spaces/rooms/wardrobe.md#primary-wardrobe-plan Places at dressing-room outline center X = 3.20, Z = -9.70.
@evidence spaces/rooms/wardrobe.md#wardrobe-storage-use Checks containment outside rear hanging depth Z = [-10.45, -9.90].
-->

The three bedrooms and dressing room have flush upper-floor ceiling lights at Y = 5.61 m. The [olive bedroom](../spaces/rooms/bedroom-two.md#bedroom-two-plan) uses center X = -3.725 m, Z = -2.405 m of X = [-5.50, -1.95], Z = [-4.56, -0.25] m; the [blue-gray bedroom](../spaces/rooms/bedroom-three.md#bedroom-three-plan) uses front-rectangle center X = 2.50 m, Z = -1.38 m of X = [-0.50, 5.50], Z = [-2.51, -0.25] m; the [primary bedroom](../spaces/rooms/primary.md#primary-plan) uses rear-body center X = -2.375 m, Z = -8.255 m of X = [-5.50, 0.75], Z = [-10.45, -6.06] m; and the [dressing room](../spaces/rooms/wardrobe.md#primary-wardrobe-plan) uses center X = 3.20 m, Z = -9.70 m of X = [0.90, 5.50], Z = [-10.45, -8.95] m. The dressing-room coordinate lies outside [rear hanging](../spaces/rooms/wardrobe.md#wardrobe-storage-use) depth Z = [-10.45, -9.90] m. Ceiling-light ids are `light:bedroom-two:ceiling`, `light:bedroom-three:ceiling`, `light:primary-bedroom:ceiling` and `light:primary-wardrobe:ceiling`. Bedside lamps are point lights realizing both lights of [primary-bedroom settings](../settings/10-house.md#primary-bedroom) and bedside/light requirements of the [olive](../settings/10-house.md#bedroom-two)/[blue-gray](../settings/10-house.md#bedroom-three) bedrooms, placed at each bedside reservation's plan center and inside the shade 0.15 m below the room table's lamp-inclusive height. For [olive-bedroom bedside](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-3.95, -3.50], Z = [-4.50, -4.05] m (lamp-inclusive 1.05 m), `light:bedroom-two:nightstand-lamp` is X = -3.725 m, Z = -4.275 m, Y = 3.96 m. For [blue-gray-bedroom bedside](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [1.05, 1.50], Z = [-3.10, -2.65] m (lamp-inclusive 1.05 m), `light:bedroom-three:nightstand-lamp` is X = 1.275 m, Z = -2.875 m, Y = 3.96 m. For [primary-bedroom bedsides](../spaces/rooms/primary.md#primary-furniture-use) X = [0.15, 0.65], Z = [-9.15, -8.65]·[-7.05, -6.55] m (lamp-inclusive 1.10 m), `light:primary-bedroom:nightstand-lamp-rear`/`-front` are X = 0.40 m, Z = -8.90·-6.80 m, Y = 4.01 m. [Bedside lamps](../models/13-bedrooms.md#nightstand-lamp) and [interior ceiling fixtures](../models/17-light-fixtures.md#flush-ceiling-fixture) are the shade/body design owners. Light heights are 0.15 m below spaces' lamp-inclusive heights; comparison against actual shade centers remains unverified until modelSources implementation. Ceiling lights use 2,700 K/7.5 cd/`range` 5.0 m; bedside lights approximately 2,400 K (1.00, 0.66, 0.38)/1.2 cd/`range` 2.5 m; all are on. Every fixture is ceiling-flush or above a bedside table, with no suspended body over bed, desk-chair or wardrobe-use reservations.

The source owner is `src/systems/lighting.ts`. Actual coordinates of four ceiling lights/four bedside points lie within their rooms' outlines/heights. Original bedroom views show flush fixtures, walls, windows and open entrances; a falsification setting upper ceiling lights to 0 left only local bedside-point wall illumination. Four bedside-lamp bodies, beds and tables are unbuilt objects, so bedside-shade readability and alignment between shade centers/light points remain unverified. Ceiling-light implementation does not complete those separate objects.

## Vanity lights in bathrooms and powder room {#interior-baths}
<!--
@evidence models/17-light-fixtures.md#vanity-wall-fixture Consumes the wall-fixture prototype's projection at most 0.10 m and above-mirror body. Three emission points align inside shades 2.00 m above finished floors without systems duplicating mirror geometry.
@evidence principles/core/common.md#scope-preservation Owns three vanity lights for powder/two bathrooms and two bathroom ceiling lights.
@evidence principles/core/common.md#substantive-completion Defines vanity coordinates/height 2.00 m above floor, projection at most 0.10 m, 3,000 K 3 cd, ceiling 2,700 K 7.5 cd and on states.
@evidence principles/core/common.md#declared-basis Receives powder-room lighting from powder settings and vanity positions/mirror bands from spaces fixture-use H2s.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds vanity/ceiling coordinates and heights above mirror bands beyond sanitary-room settings' lighting existence.
@evidence principles/design/systems.md#system-authority-confinement Writes only lights, leaving mirrors/vanities with spaces reservations and models.
@evidence principles/design/systems.md#system-dependency-basis Derives vanity positions from vanity reservations/wall faces, with the tub-bathroom light above mirror band Y = [4.16, 4.96].
@evidence principles/design/systems.md#system-verification-address Falsifying observations compare lights above mirrors, nonoverlap with mirror faces and bounds containment.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared powder settings and three sanitary-room fixture reservations; wall lights lie above mirror bands and outside head heights above use floors without parent revision.
@evidence settings/10-house.md#powder Realizes powder-room lighting through vanity/ceiling lights.
@evidence spaces/rooms/powder.md#powder-fixture-use Places the vanity light wallward of basin X = [3.65, 4.25], Z = [-0.70, -0.25].
@evidence spaces/rooms/shower-bath.md#shower-bath-plan Places ceiling light at outline center X = 1.985, Z = -7.43.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use Places vanity light on the right wall of vanity X = 2.52–3.07, Z = [-6.80, -6.10].
@evidence spaces/rooms/tub-bath.md#tub-bath-plan Places ceiling light at outline center X = 4.36, Z = -6.755.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use Places vanity light at Y = 5.06 above basin Z = [-5.75, -4.90] and mirror band.
-->

Sanitary rooms have both ceiling fixtures and wall lights above vanity mirrors. Place `light:powder-room:vanity` wallward of the [powder-room basin](../spaces/rooms/powder.md#powder-fixture-use) X = [3.65, 4.25], Z = [-0.70, -0.25] m at X = 3.95 m, Z = -0.33 m, Y = 2.00 m. The [shower-bathroom vanity](../spaces/rooms/shower-bath.md#shower-fixture-use) spans X = 2.52 m to right inner face X = 3.07 m, Z = [-6.80, -6.10] m; place `light:shower-bathroom:vanity` at X = 2.99 m, Z = -6.45 m, Y = 5.06 m (upper floor 3.06 + 2.00). The [tub-bathroom basin](../spaces/rooms/tub-bath.md#tub-fixture-use) spans X = 4.95 m to right inner face X = 5.50 m, Z = [-5.75, -4.90] m; its mirror band is Y = [1.10, 1.90] m above the upper floor, or Y = [4.16, 4.96] m, so place `light:tub-bathroom:vanity` above it at X = 5.42 m, Z = -5.325 m, Y = 5.06 m. Bathroom ceiling lights `light:shower-bathroom:ceiling`/`light:tub-bathroom:ceiling` are at [shower-bathroom](../spaces/rooms/shower-bath.md#shower-bath-plan) center X = 1.985 m, Z = -7.43 m of X = [0.90, 3.07], Z = [-8.80, -6.06] m and [tub-bathroom](../spaces/rooms/tub-bath.md#tub-bath-plan) center X = 4.36 m, Z = -6.755 m of X = [3.22, 5.50], Z = [-8.80, -4.71] m, at Y = 5.61 m. Vanity lights use approximately 3,000 K (1.00, 0.78, 0.55)/3 cd/`range` 2.5 m; ceiling lights 2,700 K/7.5 cd/`range` 5.0 m; all are on. Three vanity lights project at most 0.10 m from walls, with emission points 2.00 m above floors, clear of heads above vanity-use floors and mirror bands.

The source owner is `src/systems/lighting.ts`. Original powder/bathroom views show horizontal vanity bodies above mirrors without obscuring their faces. Powder-room faucet, basin, mirror and reflected entry door, and bathroom tile, shower/tub and frames are distinguishable under fixed lighting. Vanity lights lie within their room bounds; upper points Y=5.06 m exceed mirror top 4.96 m. Reflected displays were checked as separate observations of installed mirrors, without substituting face-identification colors for reflective-material judgment.

## Garage ceiling light {#interior-garage}
<!--
@evidence principles/core/common.md#scope-preservation Owns one garage-ceiling light's position, color, intensity, state and garage-door guide avoidance.
@evidence principles/core/common.md#substantive-completion Defines X = 8.60, Z = -4.80, Y = 2.50 m, 4,000 K, 9 cd, range 6.0 m and on.
@evidence principles/core/common.md#declared-basis Derives height from garage ceiling 2.55 m and avoidance from garage-ceiling-closure's guide reservation.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds light coordinates and avoidance clearance 1.40 m beyond the garage-space owner's outline/guide reservation.
@evidence principles/design/systems.md#system-authority-confinement Writes only the light, leaving garage door, guides and shelves with spaces/models.
@evidence principles/design/systems.md#system-dependency-basis Compares guide-reservation rear end Z = [-3.40, -0.55] with light Z.
@evidence principles/design/systems.md#system-verification-address Falsifying observations compare light Z outside guide reservation and garage frames through the mudroom.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared garage outline, ceiling datum and guide reservation; the light lies outside the reservation without parent revision.
@evidence spaces/00-building.md#attached-garage-extent Places within garage interior X = [5.75, 11.45], Z = [-6.45, -0.55].
@evidence spaces/01-storeys.md#ground-threshold-datums Derives Y = 2.50 m from garage ceiling Y = 2.55 m.
@evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure Places 1.40 m behind guide reservation Z = [-3.40, -0.55].
@evidence spaces/rooms/garage-interior.md#garage-interior-plan Uses garage room id as light affiliation.
@evidence spaces/rooms/garage-interior.md#garage-storage-use Checks nonoverlap with rear-wall shelf/workbench depth.
-->

The [garage interior](../spaces/rooms/garage-interior.md#garage-interior-plan) uses one flush `light:garage:ceiling` at [garage ceiling Y = 2.55 m](../spaces/01-storeys.md#ground-threshold-datums), placed at X = 8.60 m, Z = -4.80 m, Y = 2.50 m within [garage outline](../spaces/00-building.md#attached-garage-extent) interior X = [5.75, 11.45], Z = [-6.45, -0.55] m. The guide/leaf region reserved by [ceiling above garage-door movement](../spaces/09-ceiling-assembly.md#garage-ceiling-closure) is X = [6.00, 11.20], Y = [2.15, 2.50], Z = [-3.40, -0.55] m. The light lies 1.40 m behind its rear end Z = -3.40 m, clear of raised leaf/rails, so the leaf does not block its light. [Rear-wall shelves/workbench](../spaces/rooms/garage-interior.md#garage-storage-use) occupy only rear-wall depth without overlapping the flush ceiling fixture. The light is approximately 4,000 K (1.00, 0.85, 0.70)/9 cd/`range` 6.0 m and on.

The source owner is `src/systems/lighting.ts`. Actual light Z=-4.80 m lies 1.40 m behind guide-reservation rear end Z=-3.40 m. The original mudroom-threshold view shows garage flush light, gray walls/floor and black window; interior garage directions distinguish rails from the closed door. Current source's maximum-open prototype also confirmed four panels folding along overhead guides, separate from the open entrance. Rear-wall shelves/workbench are unbuilt objects, and this light does not claim their completion.

Actual GPU review found existing interior-point intensities saturated upper white walls/floors until boundaries disappeared. Light positions, colors, ranges, on-state population and exposure 1.0 were preserved while reference intensity of every interior point was reselected to 0.15 times its previous value. This is one house's fixed-light declaration rather than per-room screen correction and is reflected in the H2 cd values above. Shadowless interior lights still have the limitation of contribution through walls.
