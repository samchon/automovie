# Complete-surface ownership in the initial space design

## Facade, room, storey, and roof ownership map {#surface-map}

<!--
@evidence principles/core/common.md#scope-preservation Assigns complete facade, room floor/wall/ceiling, storey, roof/eave, internal-wall reveal, and site earth/paving/ridge surfaces, including thresholds and exposed gable faces.
@evidence principles/core/common.md#substantive-completion Pairs design/source addresses for each complete surface and defines surface.<owner>.<face> identity and sole authorship.
@evidence principles/core/common.md#declared-basis Connects the user's surface-ownership obligation to the actual reference plan and distinguishes authored ownership from actual emitted surface IDs grouped by owner.
@evidence principles/design/spaces.md#space-topology Treats opposite finishes of one physical shared wall as different visual surfaces, excluding internal contacts from exposed finishes.
@evidence principles/design/spaces.md#space-boundary-authority Junction calculations, cell decomposition, and repeated instances cannot split complete visual surfaces; independent objects retain whole-prototype ownership.
@evidence principles/design/spaces.md#space-verification-address Reverse-reads actual exposed source faces and keeps missing faces, multiple owners, or nonexistent boundaries unresolved before closing the initial space stage.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Narrows settings branch allocations into sole file addresses for each facade, room, roof, and site region, including actual contact-face ownership.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared build-scope space/object/finish/repetition allocation with the user's complete-surface rule. Distinguishing wall solids from their two finishes preserves every branch without a parent-allocation defect; site-allocation repairs belong to site's defect report.
@evidence settings/00-delivery.md#build-scope Assigns envelope hosts and space surfaces to spaces, ground/curbs/distant ridge to its site owner, and independent columns/doors/basin/neighbors/vegetation to models.
@evidence obligations/design/spaces.md#addressable-spatial-decisions Pairs design anchors with source for every surface, separating junction computations from actual exposed-face ownership.
@evidence contracts/obligations-spaces.md#surface-ownership Assigns thresholds, gables, exterior eave undersides, and internal-wall reveals within complete facade/room/storey/roof/site ownership and identifies omissions to inspect from actual faces.
@evidenceExclude settings/00-delivery.md#coverage-map No spaces H2 rewrites the settings-file fact-owner list. Spaces directly consume the graph, envelope, interior, site, and observation targets it names; settings account retains list-completeness responsibility.
@evidenceExclude settings/40-environment.md#daylight Spaces defines openings, occluders, and observations but no sun elevation, light direction, or exposure host. Viewer-path passes original source; actual lighting values remain downstream systems responsibility.
@evidenceExclude settings/35-objects.md#bench Bench seats/supports are independent objects, not new courtyard-paving or threshold subdivisions.
@evidenceExclude settings/35-objects.md#portable-lamp Small-lamp metal dishes/stems are model members, not complete room-wall/floor surfaces.
@evidenceExclude settings/35-objects.md#jar-rack Two-place jar racks are movable storage furniture, leaving floor-surface ownership unchanged.
@evidenceExclude settings/35-objects.md#carrying-yoke Yokes/rings are yard prototypes, not yard paving geometry.
@evidenceExclude settings/35-objects.md#handcart Stationary-cart wheels/platforms are independent exterior props, not spatial yard-path or threshold geometry.
@evidenceExclude settings/35-objects.md#bucket Empty bucket bodies/handles are portable vessels, not courtyard/yard floor faces.
@evidenceExclude settings/35-objects.md#planter Planters/soil surfaces are courtyard-edge fixtures, not site-earth or courtyard-paving subdivisions.
@evidenceExclude settings/35-objects.md#votive-plaque Blank plaque fronts are object surfaces, not sanctuary/offering wall decoration.
@evidenceExclude settings/35-objects.md#offering-tray Shallow tray plates/rims are independent props, without new ownership of altar/offering-table supporting surfaces.
@evidenceExclude settings/35-objects.md#textile Folded cloth is placed equipment, not a room ceiling/wall/floor material band.
@evidenceExclude settings/35-objects.md#stylus A stylus is a short desk prop, not a complete administration/records wall or floor surface.
@evidenceExclude settings/35-objects.md#writing-tablet Blank writing tablets are desk props, not records wall finishes or floor slabs.
@evidenceExclude settings/35-objects.md#rope-coil Loose rope loops/bindings are movable props, not merged with storage/yard paving.
@evidenceExclude settings/35-objects.md#censer An unlit censer's cup/ash/incense is independent altar equipment, not sanctuary wall/floor ownership.
@evidenceExclude settings/35-objects.md#floor-cushion Low cushion fabric is an independent object above sanctuary floor, not a subdivision of its dado or paving.
@evidenceExclude settings/35-objects.md#jar-stand A single circular stand is independent storage furniture, not floor structure or a fixed threshold.
-->

Connect the [additional space obligation](../contracts/obligations-spaces.md#surface-ownership) to actual plan boundaries. Each source address below is the sole authoring owner of a complete surface. A table does not establish compiled binding. Original production authorship belongs to one author; even during fan-out, do not divide a row's complete surface among people. [Boundaries](openings.md#boundary-ownership) singly owns internal-wall physical topology; opposite finishes belong to their respective rooms.

| Complete surface/role | Design owner | Downstream source owner | Emitted owner |
| --- | --- | --- | --- |
| South envelope and exterior entrance returns | [South](facades/south.md#south-envelope) | src/spaces/facades/south.ts | `facade-south` |
| North envelope and sanctuary north gable | [North](facades/north.md#north-envelope) | src/spaces/facades/north.ts | `facade-north` |
| Entire west envelope | [West](facades/west.md#west-envelope) | src/spaces/facades/west.ts | `facade-west` |
| Entire east envelope and exterior service door | [East](facades/east.md#east-envelope) | src/spaces/facades/east.ts | `facade-east` |
| Storey references and shared floor-structure junctions | [Storey](storey.md#ground-storey) | src/spaces/storey.ts | None; assigned to each room floor owner |
| Internal wall solids and door/window reveals (inner jamb/lintel faces) | [Boundaries/openings](openings.md#boundary-ownership) | src/spaces/boundaries.ts | `boundaries` |
| Entrance inner returns, stairs, upper landing | [Entrance](rooms/entrance.md#entrance-volume) | src/spaces/rooms/entrance.ts | `entrance` |
| Courtyard floor and continuous stone step | [Courtyard](rooms/courtyard.md#court-volume) | src/spaces/rooms/courtyard.ts | `courtyard` |
| Entire ring's inner walls, floor, exposed ceiling | [Colonnade](rooms/colonnade.md#ring-volume) | src/spaces/rooms/colonnade.ts | `colonnade` |
| Sanctuary inner walls, floor, exposed gable underside | [Sanctuary](rooms/sanctuary.md#sanctuary-volume) | src/spaces/rooms/sanctuary.ts | `sanctuary` |
| Offering inner walls, floor, low ceiling | [Offering](rooms/offering.md#offering-volume) | src/spaces/rooms/offering.ts | `offering` |
| Administration inner walls, floor, ceiling | [Administration](rooms/administration.md#office-volume) | src/spaces/rooms/administration.ts | `administration` |
| Records inner walls, floor, ceiling | [Records](rooms/records.md#records-volume) | src/spaces/rooms/records.ts | `records` |
| Storage inner walls, floor, ceiling | [Storage](rooms/storage.md#storage-volume) | src/spaces/rooms/storage.ts | `storage` |
| Yard paving, inner walls, low-wall tops | [Service yard](rooms/service-yard.md#yard-volume) | src/spaces/rooms/service-yard.ts | `service-yard` |
| Sanctuary roof top/exterior eave underside | [Sanctuary roof](roofs/sanctuary.md#sanctuary-roof) | src/spaces/roofs/sanctuary.ts | `roof-sanctuary` |
| West-wing roof top/exterior underside | [West roof](roofs/west.md#west-roof) | src/spaces/roofs/west.ts | `roof-west` |
| East-wing roof top/exterior underside | [East roof](roofs/east.md#east-roof) | src/spaces/roofs/east.ts | `roof-east` |
| North/south canopy tops/exterior ends | [Colonnade roof](roofs/colonnade.md) | src/spaces/roofs/colonnade.ts | `roof-colonnade` |
| Entire porch roof/exterior eaves | [Porch roof](roofs/porch.md#porch-roof) | src/spaces/roofs/porch.ts | `roof-porch` |
| Site earth strips, curbs, paving, neighbor ground | [Earth/curbs/paving](site.md#site-paving) | src/spaces/site/ground.ts | `site` |
| Distant ridge and foothills | [Distant ridge/foothills](site.md#distant-ridge) | src/spaces/site/ridge.ts | `site-distant` |

The 2026-09-25 object instruction added low benches, small lamps, jar racks, yokes, stationary handcarts, buckets, planters, plaques, trays, folded cloth, styluses, writing tablets, rope coils, censers, cushions, and single jar stands as independent prototypes. Instances must later review their quantities and contacts in each room. This map does not absorb their parts/volumes into room floors, walls, or site paving.

Stabilize surface IDs as `surface.<owner>.<face>` and bind them to actual boundary/element face extents. Shared internal [wall-junction](junctions.md#wall-junctions) contacts are not exposed finishes; corner cuts do not change exterior-face ownership. Exposed [gable-closure](junctions.md#gable-closures) faces also retain the facade/room/roof owners above. Junctions owns computation, not joint authorship of complete visual surfaces. Materials consumes these hosts for finish values without splitting ownership. Independent columns, frames, leaves, basins, and altars retain one prototype owner for all their surfaces; room files consume placement/contact. Repeated instances do not duplicate surface definitions.

Room floors include thresholds within wall thickness assigned by [threshold ownership](storey.md#threshold-support). Colonnade and room must not each build half a threshold, nor may a door model cover it with another floor. Measurement support patches and computational cell subdivisions do not split complete-surface ownership either.

This map is not compiled host binding. Reverse-read every actual exposed source face, retaining missing faces, multiple owners, and nonexistent boundaries as unresolved cases. `npm run self-check` lists actual emitted surface IDs grouped by owner; that listing does not automatically verify this authored table. [Site](site.md#site-extent) owns ground, curbs, and distant-ridge surfaces separately from the building. Each neighbor-envelope/tree/grass model singly owns its whole prototype; instances places it inside [placement zones](site.md#placement-zones). Do not mix site surfaces into building surfaces.

## Lower bands on colonnade and sanctuary walls {#interior-dado}

<!--
@evidence principles/core/common.md#scope-preservation Divides the lower band around the whole colonnade and four sanctuary walls, explicitly excluding other rooms and exterior facades.
@evidence principles/core/common.md#substantive-completion Defines band top Y=0.60m, two dado IDs, door interruptions, and buried-face treatment so source does not choose new boundaries.
@evidence principles/core/common.md#declared-basis Uses material-language/sanctuary for band existence/scope; 0.60m is an authored choice from image 03/04 door-height comparisons.
@evidence principles/design/spaces.md#space-topology Splits existing finishes only, creating no space, boundary, or curb and blocking no door.
@evidence principles/design/spaces.md#space-boundary-authority Existing facade/boundary owners retain wall solids, colonnade/sanctuary retain dado surfaces, and materials owns values.
@evidence principles/design/spaces.md#space-verification-address Fails bands leaking into other rooms, inconsistent heights, door crossings, or overlapping surfaces across six colonnade regions/four sanctuary walls/door sides.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns the low reddish-brown color relation into spatial surface subdivision with fixed height, IDs, and rooms.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared material-language band scope, walls height boundaries, sanctuary low red band, and room door heights. One horizontal division of existing finishes satisfies them without parent changes.
@evidence settings/20-envelope.md#material-language Limits reddish-brown bands to courtyard-surrounding colonnade and sanctuary lower walls; administrative rooms retain light plaster.
@evidence settings/20-envelope.md#walls Locates the material boundary at a constant height above floor rather than an arbitrary patch.
@evidence settings/30-interiors.md#sanctuary Receives image 04's low red band as dado on all four sanctuary walls.
@evidence contracts/obligations-spaces.md#surface-ownership Assigns new dado surfaces to complete room ownership without overlapping two surfaces on one wall face.
-->

[Material relations](../settings/20-envelope.md#material-language) place continuous reddish-brown bands around courtyard/sanctuary lower walls while administrative rooms retain light plaster. [Envelope canon](../settings/20-envelope.md#walls) aligns materials to members/heights, and [sanctuary](../settings/30-interiors.md#sanctuary) adopts image 04's low red band. This H2 defines spatial surface subdivisions: courtyard-surrounding walls use [colonnade](rooms/colonnade.md#ring-volume) finish `surface.colonnade.wall`; [sanctuary](rooms/sanctuary.md#sanctuary-volume) uses `surface.sanctuary.wall`.

Author decision: the band top is a horizontal line 0.60m above both rooms' finished Y=0 floors. In images 03/04, comparison with door heights suggests around 0.5~0.75m; this choice lies within that range and is not surveyed. Below are `surface.colonnade.dado` and `surface.sanctuary.dado`; above retain original finish IDs. Both bands continue at one height, interrupted only at voids/frames. Offering, administration, records, storage, service yard, and exterior facades receive no band.

This coplanar face subdivision changes no wall solid/thickness and creates no space, boundary, or member. Add no ledge or projection at the top. Buried wall faces also belong to dado but remain concealed behind floor slabs. The [ownership map](#surface-map) colonnade/sanctuary rows apply; both dado surfaces are complete surfaces of those room owners. Materials binds color, roughness, and wear. `src/spaces/ownership.ts` exports target surfaces/height; environment splits corresponding wall faces there.

Observe walls in all six colonnade regions, all four sanctuary walls, and band ends beside every door in owner-color and delivery views. Bands leaking into administrative/offering rooms or outside, differing heights, crossing voids, or two surfaces on one wall face fail.
