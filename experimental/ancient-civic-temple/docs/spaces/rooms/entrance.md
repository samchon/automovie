# Entrance recessed within the rectangle

## Main door and porch depth {#entrance-volume}

<!--
@evidence principles/core/common.md#scope-preservation Fits the recessed entrance, two stone steps, upper landing, column supports, and recessed-wall threshold inside the rectangular outline.
@evidence principles/core/common.md#substantive-completion Defines 0.12m risers, 0.35m treads, 1.8m width, landing depth, column center Z=10.00m, beam width, and each cell's lower boundary.
@evidence principles/core/common.md#declared-basis Uses plan datums for the entrance extent and road/storey levels for heights; the table's Z intervals are arithmetic derived by subtracting tread depths.
@evidence principles/design/spaces.md#space-topology Subdivides steps and side supports into cells within one entrance without inserting another room on the main-door-to-colonnade/courtyard axis.
@evidence principles/design/spaces.md#space-boundary-authority Assigns steps, landing, and inner returns to the entrance, outer faces to the south facade, and roof to the porch owner.
@evidence principles/design/spaces.md#space-verification-address Compares actual treads and cell lower boundaries in the road-to-open-door longitudinal section, and examines both door faces and column-support sections.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns the porch and low stone steps into a two-step section bridging the road height and locating its columns.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the two entrance-porch columns with ground-access riser and tread limits. Two steps and a landing fit in the recess without projecting into the road or changing the parent's level difference.
@evidence settings/20-envelope.md#entrance-porch Reserves equal-height column supports and actual beam/triangular-infill contact near the front of the entrance.
@evidence settings/10-building.md#ground-access Resolves the entrance height with actual horizontal treads and two risers, without substituting sloped support.
-->

The body of space ID `entrance` is a roofed exterior transition spanning west-porch-inner~east-porch-inner and entrance-front~south-outer in the [plan datums](../building.md#plan-datums). The recessed rear wall occupies entrance-back~entrance-front, with an actual central double door into the colonnade. No wall or room bends the sightline from the main entrance axis to the courtyard center. The side returns have actual thickness between porch-inner~porch-outer and join the front envelope.

The entrance owns the threshold floor and passage volume of `door-entry` in the recessed wall under the [storey allocation](../storey.md#threshold-support), continuous from the upper landing to the colonnade-side wall face.

Each of the two stone steps has a 0.12m riser and 0.35m usable tread. Within the front outline, they rise from the road contact to the entrance's upper landing at Y=0. The stair width is 1.8m and the landing depth in front of the door is 1.2m. Each porch column base is no larger than 0.5m square, centered at X=±1.35m, Z=10.00m to avoid the returns and central stair, with its front aligned to south-outer. A horizontal beam above the capitals occupies a 0.30m width inside south-outer and supports the [south facade](../facades/south.md#south-envelope) triangular infill. Beam, infill, and porch front therefore read as one gable near the frontage. Stone side supports continue beneath both columns to Y=0, rather than leaving them on treads of different heights. Members must meet the actual beam and gable under the [front porch setting](../../settings/20-envelope.md#entrance-porch). Front and both diagonal views of the assembled columns, beam, and gable, together with parallel column-support sections, showed neither floating bases nor a gap between beam and gable.

The longitudinal section subtracts the preceding tread depth twice in the -Z direction from south-outer, leaving the upper landing to entrance-front. Heights follow the [road and storey floor](../storey.md#ground-storey). The following values show this input arithmetic; they are neither independent dimension authorities nor compiled measurements.

| Central stair segment | Z interval (m) | Finished Y (m) | Junction |
| --- | --- | --- | --- |
| First tread | 9.90~10.25 | -0.12 | One riser above the road at south-outer |
| Second tread | 9.55~9.90 | 0 | One riser above the first tread |
| Upper landing before the door | 8.35~9.55 | 0 | Continuous at the second tread's level |

The central X interval extends half the stair width to either side of the axis. Beyond it, stone supports continue at Y=0 throughout the entrance depth to the inner returns. Do not add a riser or overlapping slab between the second tread and landing. Only road→first tread and first→second tread have vertical risers; do not cover them with sloped support. One entrance floor owner owns the actual horizontal and vertical faces of treads, landing, and supports. Assign walking support only to actual horizontal faces, without counting occupied column bases or open leaves as passage clearance.

This is one `entrance` space. Subdivide its `cells` at floor-height changes and side supports. Each lower boundary is the corresponding finished surface; the upper boundary is the actual underside of the [composed porch roof](../roofs/porch.md#porch-roof). Do not copy the lowest stair level throughout the entrance and include the stone interior in the space. The level second tread and landing may merge; additional cells needed beneath a sloped roof still belong to the same space. The recessed-wall threshold cell follows the existing storey allocation. Cell interfaces create no physical walls, new rooms, or new circulation paths. Actual beam, column, and leaf collisions require separate examination.

Source `src/spaces/rooms/entrance.ts` owns the entrance space, stone steps, upper landing, and complete inner-return surfaces. The respective [facade](../facades/south.md#south-envelope) and [roof](../roofs/porch.md#porch-roof) owners own the exterior frontage and porch roof. Observe the longitudinal section road→two steps→landing→open door→colonnade, [parallel sections](../observations.md#geometry-observations) through column supports at X=±1.35m, all four corners, and both sides of the door threshold. The X=0 longitudinal section misses the column supports, so inspect their contact with the columns in parallel sections; camera movement does not establish actual foot-support continuity.
