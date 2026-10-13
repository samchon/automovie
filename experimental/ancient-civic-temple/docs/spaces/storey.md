# Ground-storey heights and ground contact

## One ground storey {#ground-storey}

<!--
@evidence principles/core/common.md#scope-preservation Assigns all spaces to temple-ground; local courtyard/entrance/altar level changes create no storey.
@evidence principles/core/common.md#substantive-completion Defines colonnade Y=0, courtyard -0.12m, main road -0.24m, floor thickness, and low-ceiling/beam height budgets.
@evidence principles/core/common.md#declared-basis Distinguishes design heights consuming production coordinates/access limits from actual threshold/courtyard/step section comparisons; inputs 0m/-0.12m/-0.24m alone do not establish ground contact.
@evidence principles/design/spaces.md#space-topology Sanctuary/colonnade follow sloped roof undersides; nonhabitable structural gaps above administrative/offering rooms receive neither entry nor new floor.
@evidence principles/design/spaces.md#space-boundary-authority Storey defines only reference heights/thickness/shared joins; room finishes and altar platform retain their owners.
@evidence principles/design/spaces.md#space-verification-address Reads longitudinal/transverse sections, thresholds, and courtyard boundaries; interrupted colonnade floors or service-route changes over 0.02m fail.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns single-storey/local-low-step permission into finished levels and a 2.92m below-beam budget.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared access riser/threshold limits with low-plank/exposed-gable ceilings. Two main steps and one courtyard step fit without changing settings' storey count or access conditions.
@evidence settings/00-delivery.md#coordinates Sets colonnade finished floor Y=0 to compare all rooms/road in one metre coordinate system.
@evidence settings/10-building.md#ground-access Separates local stone steps from continuous service floors within one storey.
@evidence settings/20-envelope.md#ceilings Distinguishes low-plank rooms from exposed sloped sanctuary/colonnade undersides as different height boundaries.
-->

Storey ID `temple-ground` has parent `temple` and contains all [building spaces](building.md#containment). Y=0 is the [settings-coordinate](../settings/00-delivery.md#coordinates) finished colonnade floor; sanctuary, offering, administration, records, storage, and yard share it. Ordinary floor structure extends 0.18m below finished level; respective room surface owners own tops and vertical sections. This file owns storey membership, reference heights, and shared structural interfaces without duplicating finishes.

Courtyard finished level is Y=-0.12m. The main-road access contact is Y=-0.24m, with two steps inside the recessed entrance to colonnade. Ground before the exterior service door is Y=0; [site grade](site.md#site-grade) owns its transition to the main road. These inputs consume [ground-access](../settings/10-building.md#ground-access) limits without a basement or split storey. Later fit-out owns the altar's local stone platform without adding a storey.

Offering, administration, records, and storage horizontal plank-ceiling undersides are Y=3.10m, with 0.10m structural reservation above and 0.18m exposed-beam depth below. Clear height under beams is therefore 2.92m, above door-frame tops. Later members must fit actual beam/plank sections between these reservations and roof undersides. Sanctuary/colonnade do not consume this low ceiling; each follows its exposed sloped underside. Structural gaps are nonhabitable, without doors, floors, or ladders.

A common storey label alone does not verify level changes. Source `src/spaces/storey.ts` binds finished heights/thicknesses to actual space floors. Observe Y-referenced longitudinal/transverse sections, every threshold, and courtyard edges. Interrupted colonnade floors or service-route height differences above 0.02m fail. Direct reading of eight actual threshold sections and entrance/courtyard steps found neither colonnade-floor interruption nor service-threshold level differences.

## Threshold floors crossing wall thickness {#threshold-support}

<!--
@evidence principles/core/common.md#scope-preservation Assigns floor/passage volumes across wall thickness to all colonnade doors and the exterior service door, leaving no gap between space bodies.
@evidence principles/core/common.md#substantive-completion Assigns each whole threshold to the non-colonnade room and defines slab reservations, usable support, and passage-cell extents.
@evidence principles/core/common.md#declared-basis Derives depth/width from actual opening hosts/profiles and ordinary storey thickness; consumes access settings for level limits.
@evidence principles/design/spaces.md#space-topology Extends room cells through openings to opposite wall faces, excluding closed walls and frames from passage volume.
@evidence principles/design/spaces.md#space-boundary-authority Per-door ownership prevents two half-threshold authors or an extra floor supplied by a door model.
@evidence principles/design/spaces.md#space-verification-address Compares actual mesh tops, support heights, room volumes, and connectors in one output to detect unsupported declarations or duplicate floors.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes low-threshold permission implementable through full-wall-depth slab reservations and cell ownership.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Applying ground-access thresholds 0~0.02m and actual openings reveals permits level through-floors without relaxing parent limits.
@evidence settings/10-building.md#ground-access Makes actual foot support, beyond connection lines, concrete by comparing threshold slabs/supports.
@evidence settings/20-envelope.md#openings Uses actual wall-depth reveals so both door-side floors consume one through-region.
-->

[Listed doors](openings.md#doors) need actual floor between both wall faces. Do not stop colonnade/room floors at their own inner faces and leave the thickness empty. Threshold finished Y=0 consumes ordinary floor thickness below. Main entrance steps and the lower courtyard step are different contacts retaining their respective space owners.

For colonnade doors, the non-colonnade space singly owns the entire threshold: `door-entry`→entrance, `door-sanctuary`→sanctuary, `door-offering`→offering, the three east room doors→administration/records/storage, and `door-yard`→service-yard. Service-yard also owns exterior `door-service-exterior` to the outer wall face. Threshold top/end sections belong to that room's complete floor surface, without joint or half-floor ownership. Storey owns only the common rule and generates no duplicate solid floor.

Derive depth from actual host wall faces and longitudinal extent from the profile's floor cut. Continue slabs beneath jambs; usable walking support patches exclude frames, open leaves, and hardware. Target level change 0, consuming existing [ground-access](../settings/10-building.md#ground-access) limits. Colonnade floor/threshold meet at a common level end line without positive-area overlap or wall-thickness interruption; inside, they continue into the same owner's floor.

Ordinary room slabs touch inner wall faces, but threshold slabs enter wall thickness. Remove their actual plan/thickness below finished floor from wall solids to prevent positive-volume overlap. Walls beneath may continue to slab underside without covering slab or passage void. This structural reservation derives from floor ownership; it is not a new opening reducing profile clear dimensions or leaf fitting.

Room-document rectangles describe room bodies. Add the wall-thickness clear-width/height passage volume to that room's `cells` union so threshold support belongs inside. This extends an existing opening, creating no new space, wall, or door. Exclude frames/closed walls; share only the open interface with opposite colonnade/exterior. Compare actual `IAutoMovieBuiltSurface.space`, support heights, mesh tops, room volume, and connector entry/arrival in one output. Actual section continuity, space/surface ownership checks, and door-passage SAT including open leaves showed no failures. Connector declarations alone were not used as solid inspection results.

## Outer-wall bottoms and ground contact {#wall-ground-contact}

<!--
@evidence principles/core/common.md#scope-preservation Applies one bottom to four facades/parapets, low yard walls, recessed entrance/returns, and front-step structure; includes service thresholds in contact inspection.
@evidence principles/core/common.md#substantive-completion Defines bottom as floor thickness below the lower of minimum exterior-contact grade and adjacent finished levels; site minimum -0.24m gives -0.42m by arithmetic.
@evidence principles/core/common.md#declared-basis Minimum contact comes from the site owner; -0.42m is input arithmetic, not a structural embedment calculation.
@evidence principles/design/spaces.md#space-topology Closes existing wall plans downward without adding room cells, walking support, or storeys below ground.
@evidence principles/design/spaces.md#space-boundary-authority Site owns ground, facades wall solids, entrance steps, and storey only bottom calculation; existing floor owners provide threshold reservations.
@evidence principles/design/spaces.md#space-verification-address Reads ground, wall bottoms, and slabs in one section; floating solids, volume overlaps, buried steps, and wall strips above passage fail separately.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns environmental plinth contact into a site-responsive common wall-bottom rule and downward extension of entrance-front structure.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared site path continuity/plinth contact with grade. Site joins the two contact heights and supplies the minimum without arbitrary parent terrain or structural guarantees.
@evidence settings/40-environment.md#site Derives bottoms along complete contact lines so wall-edge soil/access ground actually meets walls and no wall ends above the lowest known contact.
-->

Consume [environmental contact requirements](../settings/40-environment.md#site). [Site grade](site.md#site-grade) owns exterior heights; storey invents no slope or terrain. Along actual exterior wall contact lines, take the lower of minimum grade and the lowest finished floor/step meeting a wall, then subtract [ordinary floor thickness](#ground-storey) for the common bottom. This embedment is geometry input avoiding visible gaps, not soil bearing capacity, foundation calculation, or ancient construction dimensions.

Site grade depends only on Z and lowers toward the front, so minimum exterior contact is Y=-0.24m at south-outer. Source consumes the site owner's exported minimum without choosing another. The lowest adjoining finished floor is higher, giving bottom -0.24-0.18=-0.42m by input arithmetic. If site changes produce a lower contact, derive a lower bottom again. Actual contact/embedment judgments still require every section below.

Four outer walls, recessed wall, and returns consume this bottom as closed solids within existing plan thickness up to roof/coping/existing tops. Low yard walls start there too, preserving facade-owned tops. Lower corners retain [butt joins](junctions.md#wall-junctions). [Entrance](rooms/entrance.md#entrance-volume) tread/column-support regions touching grade at south-outer extend their structure bottoms to this common bottom: ordinary 0.18m thickness would leave a 0.06m gap between Y=0 support underside and Y=-0.24m grade. This thickens the existing entrance floor without new steps, treads, outline expansion, or another plinth mass. It creates no basement, passage, or observation space. Buried walls do not extend room `cells` or walking support downward. Original facades retain solids/complete surfaces; storey owns only the bottom calculation.

Wall extensions consume [threshold slab reservations](#threshold-support). Ground/paving meets actual exposed exterior faces without duplicate ground over room floors, courtyard, or entrance steps. Preserve site/building face owners rather than hiding gaps with another floor.

At all four sides, corners, entrance returns, and service thresholds, compare actual ground, wall bottoms, interior slabs, and threshold reservations in longitudinal section. Floating walls, floor/wall volume overlaps, buried steps, or wall strips above passage fail. Even after site geometry exists, contact, embedment, and cutting remain unverified until every section is read.
