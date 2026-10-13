# Reference plan for the single-storey civic temple

## Outline and dimension selection {#footprint}

<!--
@evidence principles/core/common.md#scope-preservation Includes colonnade, courtyard, service yard, and recessed entrance inside the outer wall line, excluding the road from the roughly 430㎡ denominator.
@evidence principles/core/common.md#substantive-completion Selects 21×20.5m, 0.6m outer walls, and 0.3m inner walls after comparison with the rejected shallow-sanctuary candidate.
@evidence principles/core/common.md#declared-basis Names the fixed graph and area range as parents; 430.5㎡ is selected-input arithmetic rather than photographic surveying.
@evidence principles/design/spaces.md#space-topology Binds the outline to a colonnade/courtyard between side rooms and an undivided long left room without a separate corridor.
@evidence principles/design/spaces.md#space-boundary-authority Building.ts owns only extent and assembly, without absorbing complete facade/room surfaces; the next unit owns detailed datums.
@evidence principles/design/spaces.md#space-verification-address Makes a changed compiled outline or a second storey/courtyard counterexamples to this selection.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Narrows permitted area into actual outline and wall thickness while retaining sanctuary depth and courtyard width together.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared 10-building area/nearly-square limits with altar/carrying dimensions. A revised space candidate resolved the shallow sanctuary without reducing parent scale or objects. Maps do not yet exist.
@evidence settings/10-building.md#scale Selects 430.5㎡ inside outer wall lines, including courtyard and yard, within the permitted 410~450㎡.
@evidence settings/10-building.md#fixed-graph Places rear sanctuary, long left room, right rooms, and central courtyard in the same outline.
@evidence settings/35-objects.md#altar Chooses deeper sanctuary space instead of reducing the altar to a panel.
-->

This design consumes the [fixed graph](../settings/10-building.md#fixed-graph) and [area range](../settings/10-building.md#scale). Outer wall lines form one rectangle X=-10.5~10.5m, Z=-10.25~10.25m. Selected input area is 21×20.5=430.5㎡, with a long/short side ratio around 1.024. Colonnade, courtyard, service yard, and recessed entrance lie inside; the road lies outside. This arithmetic compares design inputs rather than reporting compiled measurements.

Outer walls are 0.6m thick and internal boundary walls 0.3m. Side rooms have 4m usable depth, with a column-base colonnade and central courtyard between them. The north sanctuary gains a broad frontal axis and altar approach. Three right rooms divide the same depth into writing, reading, and storage workplaces. The long left offering room has no separate corridor or back room; wall displays and long-table use areas make its length legible.

An earlier 22×19.6m candidate had a 12.2×4.1m sanctuary too shallow for its width; widening side rooms to 5m greatly reduced the courtyard. The selected 21×20.5m outline retains sanctuary depth 5.5m and courtyard width 7m together. These dimensions do not come from photograph pixels. Rather than shrinking objects, the design provides room for the [altar](../settings/35-objects.md#altar) and [carrying envelope](../settings/10-building.md#use-profile). Comparing that envelope with actual world triangles including assembled leaves and columns found no collision at eight doors, colonnade turns, or the explicit service route. This does not judge arbitrary free paths or all unfinished props.

Building ID is `temple`. Source `src/spaces/building.ts` owns only building extent and assembly, without concentrating complete facade/room surfaces here. The [observation design](observations.md#geometry-observations) tests outline, area, and room relations. A compiled outline differing from this rectangle or a second storey/courtyard requires repair at this owner first.

## Shared plan datums {#plan-datums}

<!--
@evidence principles/core/common.md#scope-preservation Names every X/Z line consumed by downstream boundaries, from both outer-wall faces to courtyard, colonnade, administrative rooms, and entrance returns.
@evidence principles/core/common.md#substantive-completion Fixes wall-face thicknesses and room ends in the table, with shared-input comparison tolerance 0.001m.
@evidence principles/core/common.md#declared-basis Inherits coordinates; the tolerance compares authored agreement rather than archaeological survey accuracy.
@evidence principles/design/spaces.md#space-topology Defines paired faces separated by one physical wall, including yard south and storage north.
@evidence principles/design/spaces.md#space-boundary-authority Downstream files reference datum names without duplicate constants; opening owners retain local door-center coordinates.
@evidence principles/design/spaces.md#space-verification-address Rereads affected rooms, facades, roofs, doors, and observations after line changes, comparing input boundaries within 0.001m.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns Y-up coordinates into actual X/Z datums distinguishing entrance recess and three administrative rooms.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 00-delivery metre units and front/rear/left/right conventions determine every datum's sign and order without another coordinate system or parent correction.
@evidence settings/00-delivery.md#coordinates Applies production coordinate signs and north-to-south ordering to X/Z.
-->

Use the [coordinate convention](../settings/00-delivery.md#coordinates) unchanged. These datums are the sole dimensional authority for wall faces and space boundaries. Other files reference names without copying values. `west`/`east` pairs differ only in X sign. Z is ordered north to south; each opening owner defines separate local door dimensions.

| Datum | X or Z (m) | Meaning |
| --- | ---: | --- |
| west/east-outer | X=∓10.5 | Outer wall exterior face |
| west/east-inner | X=∓9.9 | Outer wall interior face |
| west/east-room | X=∓5.9 | Side-room wall face toward colonnade |
| west/east-ring | X=∓5.6 | Colonnade wall face toward rooms |
| west/east-court | X=∓3.5 | Floor boundary between open courtyard and colonnade |
| west/east-porch | X=∓1.8 | Entrance-return center support line |
| west/east-porch-inner | X=∓1.65 | Entrance-facing return surface |
| west/east-porch-outer | X=∓1.95 | Colonnade-facing return surface |
| north-outer | Z=-10.25 | Rear outer-wall exterior face |
| north-inner | Z=-9.65 | Rear outer-wall interior face |
| sanctuary-front | Z=-4.15 | Sanctuary south wall face |
| north-ring | Z=-3.85 | North-colonnade wall face toward sanctuary |
| yard-front | Z=-2.45 | Service-yard south wall face |
| storage-back | Z=-2.15 | Storage north wall face |
| court-back | Z=-1.75 | Courtyard north floor boundary |
| storage-front | Z=1.55 | Storage south wall face |
| records-back | Z=1.85 | Records north wall face |
| records-front | Z=5.6 | Records south wall face |
| office-back | Z=5.9 | Administration north wall face |
| court-front | Z=6.1 | Courtyard south floor boundary |
| entrance-back | Z=8.05 | Recessed entrance wall's colonnade face |
| entrance-front | Z=8.35 | Recessed entrance wall's exterior face |
| south-inner | Z=9.65 | Front outer-wall interior face |
| south-outer | Z=10.25 | Front outer-wall exterior face |

Compare space-design inputs within 0.001m at these datums. This is an authoring tolerance for shared source boundaries, not archaeological survey precision. One physical wall separates two space faces by its thickness; do not overlap two walls at the same position. Changing a shared datum requires rereading affected rooms, facades, roofs, doors, and observation positions. Source exports these values as single inputs consumed by downstream owners without duplicate constants.

## Connection hierarchy {#containment}

<!--
@evidence principles/core/common.md#scope-preservation Places every space from entrance to service yard beneath temple's only ground storey, without destinations reachable only through another room.
@evidence principles/core/common.md#substantive-completion Defines building/storey/space parents and addresses responsible for colonnade, doors, and use routes.
@evidence principles/core/common.md#declared-basis Realizes the settings' building connections as a named temple/ground-storey hierarchy.
@evidence principles/design/spaces.md#space-topology Keeps all four colonnade sides as one space, directly connected to each room and yard through doors.
@evidence principles/design/spaces.md#space-boundary-authority Leaves ring regions to colonnade, door relations to openings, and use sequence to circulation without duplicating them in the parent list.
@evidence principles/design/spaces.md#space-verification-address Reads actual storeyId/parents and traversed voids, floors, and leaves to detect disconnection despite a correct relationship list.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Groups the fixed layout beneath one temple ground storey with direct access, providing parent identities for downstream generation.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Applying 10-building's single storey, direct colonnade doors, and permitted service exterior door needs neither room detours nor a second corridor, so the fixed graph is unchanged.
@evidence settings/10-building.md#fixed-graph Transfers every required space's common-storey membership and direct colonnade access into parent/connection lists.
@evidence settings/10-building.md#civic-identity Connects communal offering, records, administration, and storage in one building rather than making only a sanctuary hall.
@evidence obligations/design/spaces.md#space-reference-topology Names temple→temple-ground→all spaces and direct colonnade access, linking door/route owners.
-->

`temple` has one [ground storey](storey.md#ground-storey), containing entrance, courtyard, colonnade, sanctuary, offering, administration, records, storage, and service yard. The rear sanctuary, left offering room, and three right rooms each have a direct colonnade door. The yard also has a direct door to the same colonnade; its exterior door meets actual service access. No destination requires passing through another room.

One [colonnade](rooms/colonnade.md#ring-volume) owns the courtyard ring. Do not register four sides as different rooms or add a second corridor by the yard. [Boundaries and openings](openings.md) owns room doors; [circulation](circulation.md) owns use routes. Read actual storeyId/parent connections from the output for containment, and actual traversed voids, floors, and leaves as well as reached IDs for routes.

## Building contacts receiving exterior access {#approach-contacts}

<!--
@evidence principles/core/common.md#scope-preservation Retains separate main stair-foot and service-threshold contacts for both exterior approach heights.
@evidence principles/core/common.md#substantive-completion Fixes contact-temple-public/contact-temple-service spaces, reference boundaries, entry directions, and width ownership in the table.
@evidence principles/core/common.md#declared-basis Uses datums for position, storey for height, stair/door owners for usable width, and site for exterior ground/connectors.
@evidence principles/design/spaces.md#space-topology Connects two interfaces from temple-site to existing entrance/service-yard spaces without promoting them into new rooms or exterior nodes.
@evidence principles/design/spaces.md#space-boundary-authority Building exports only contact relations; existing spaces own doors/floors and site owns exterior ground.
@evidence principles/design/spaces.md#space-verification-address Checks interface agreement, threshold levels, and curb/drainage-groove/leaf intrusion against bidirectional carrying envelopes.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Gives road/service approaches separate stable IDs and building-outline interfaces.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared 10-building's local main stairs and level service access with 40-environment's continuous exterior paths. Two contacts coexist and site connectors consume them without changing parent conditions.
@evidence settings/10-building.md#ground-access Does not copy the main stair-foot height to the service threshold; service entry consumes the yard-connected height.
@evidence settings/40-environment.md#site Provides two site-connector interfaces requiring road and exterior service path to meet actual building contacts.
-->

Building `temple` receives exterior walking at two contacts connected to its existing ground-storey spaces. These IDs identify building-side floor/access boundaries, not new rooms, additional doors, or site-side spaces. Positions consume [datums](#plan-datums), floor heights the [storey](storey.md#ground-storey), and widths actual stair/door designs. `src/spaces/building.ts` exports these relations without copying floor or door meshes.

| Contact ID | Building-side connection and position | Usable interface extent | Entry direction from outside |
| --- | --- | --- | --- |
| contact-temple-public | exterior→entrance; main axis X=0, stair foot at Z=south-outer | [Entrance stair](rooms/entrance.md#entrance-volume) width and storey-owned main-road height | -Z; two steps to upper landing and door-entry |
| contact-temple-service | exterior→service-yard; X=east-outer, Z at door-service-exterior center | [Exterior service door](openings.md#doors) usable width excluding frame and storey-owned exterior service height | -X; through the outer-wall threshold into the yard |

The public contact uses the exterior floor receiving the stair foot. Copying it to the upper landing would erase the steps; copying it to the service door would create an unintended level change. Compare plan alignment with the [datum tolerance](#plan-datums), and service thresholds with the [yard level-change limit](rooms/service-yard.md#yard-volume). Test doors both ways; the listed directions indicate entry sequence. Check curbs, drainage grooves, vegetation, and leaves against actual passage envelopes too.

[Site](site.md#site-extent) owns exterior ground, paths, curbs, and extent. [Site grade](site.md#site-grade) joins main road Y=-0.24m and exterior service Y=0; two [site/building connectors](site.md#site-connections) receive these contacts from `temple-site`. The maps branch is closed, so there is no separate world→site approach node; the front street and alley within the site extent end exterior walking. [Circulation](circulation.md) starts at building-side contacts, while [observations](observations.md#geometry-observations) owns bidirectional passage and ground-contact checks including the site. Actual threshold, stair, and ground longitudinal sections were read, and bidirectional door/service-route SAT collision checks including open leaves and columns completed. Sections established floor support; actual triangles established body passage.
