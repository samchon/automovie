# Material bindings of spatial surfaces

## Spatial surface bindings {#space-binding-map}

<!--
@evidence principles/core/common.md#declared-basis Uses complete IDs from ownership, site.paving, and composed roof faces as binding inputs.
@evidence principles/core/common.md#scope-preservation Assigns one key to every emitted spatial face without adding wall/roof/floor geometry or model parts.
@evidence principles/core/common.md#substantive-completion Assigns 96 IDs without omissions/duplicates and specifies concealed bearing/joint/roof fallback.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Derives specific limestone/paving/plaster/dark-wood keys from surface IDs, distinguishing opposite faces of one physical wall.
@evidence principles/design/materials.md#material-construction-appearance Assigns only finishes to spatial structure; palette/model table retains properties/repeat lengths.
@evidence principles/design/materials.md#material-binding-interface Consumes surface.<owner>.<face> and world-metre UV0; missing texture UV0 fails.
@evidence principles/design/materials.md#material-verification-address Compares 01 porch/walls/tiles, 03 courtyard floor/band, 04 ceiling, and 05 records floor; plaster on floors fails.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Compared 96 IDs and existing site/upper/edge/soffit UV0 with assignments, without new space faces.
@evidence obligations/core/common.md#layer-boundary Reads spatial IDs only, defining keys here and model-part assignments separately.
@evidence obligations/design/materials.md#material-surface-assignment Assigns one finish per emitted ID plus concealed bearing/joint/roof fallback.
@evidence settings/00-delivery.md#build-scope Finishes existing wall/floor/roof faces without taking geometry, placement, or rendering.
@evidence settings/10-building.md#fixed-graph Uses distinct courtyard/colonnade/sanctuary/east-room owners for floor/wall/ceiling keys.
@evidence settings/30-interiors.md#offering-room Offering floor/wall/ceiling use paving/plaster/dark-wood.
@evidence settings/30-interiors.md#administration Administration floor/wall/ceiling use paving-small/plaster/dark-wood on separate IDs.
@evidence settings/30-interiors.md#storage Storage floor/wall/ceiling use paving-small/plaster/dark-wood on separate IDs.
@evidence spaces/building.md#containment Uses distinct room owners to separate floor/wall/ceiling keys.
@evidenceExclude spaces/building.md#plan-datums Spaces consumes X/Z datums when emitting faces; materials consumes only completed IDs/metre UV0 for keys.
@evidence spaces/facades/east.md#east-envelope East outer/bearing/joint use plaster; plinth/coping/footing/reveal limestone.
@evidence spaces/facades/south.md#south-envelope South outer/parapet-back plaster remains separate from coping/plinth limestone.
@evidence spaces/facades/west.md#west-envelope West outer/sanctuary-flank plaster remains separate from plinth/coping limestone.
@evidence spaces/ownership.md#surface-map Assigns each of 96 complete IDs a key.
@evidence spaces/rooms/administration.md#office-volume Administration floor paving-small/wall plaster/ceiling dark-wood.
@evidence spaces/rooms/colonnade.md#ring-volume Colonnade floor paving/dado red/wall plaster/ceiling dark-wood remain separate.
@evidence spaces/rooms/entrance.md#entrance-volume Entrance floor paving; return/pediment-back plaster.
@evidence spaces/rooms/offering.md#offering-volume Offering floor paving/wall plaster/ceiling dark-wood remain separate.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume Sanctuary floor paving/wall plaster/dado red/ceiling dark-wood have distinct IDs.
@evidence spaces/storey.md#ground-storey Assigns every interior ground-storey floor without new storeys or levels.
-->

Assign each `surface.<owner>.<face>` from [complete ownership](../spaces/ownership.md#surface-map), [site paving](../spaces/site.md#site-paving), and [roof composition](../spaces/roofs/assembly.md#roof-junctions) one key below. This table owns spatial finishes only, creating no wall/roof/floor geometry or model parts. [Palette](00-surface-palette.md) owns properties; [keys](10-model-bindings.md#binding-map) owns repeat lengths/base colors. Unlisted emitted faces, duplicate assignments, or nonexistent faces fail. Concealed bearing/joint uses wall plaster base color and concealed roofs adjacent timber base color, not separate visible ornament.

| Emitted spatial surface ID | Binding key |
| --- | --- |
| `surface.colonnade.dado` | `dado` |
| `surface.sanctuary.dado` | `dado` |
| `surface.administration.ceiling`, `surface.administration.ceiling-back` | `dark-wood` |
| `surface.colonnade.ceiling` | `dark-wood` |
| `surface.offering.ceiling`, `surface.offering.ceiling-back` | `dark-wood` |
| `surface.records.ceiling`, `surface.records.ceiling-back` | `dark-wood` |
| `surface.roof-colonnade.concealed`, `surface.roof-colonnade.edge`, `surface.roof-colonnade.soffit` | `dark-wood` |
| `surface.roof-east.concealed`, `surface.roof-east.edge`, `surface.roof-east.soffit` | `dark-wood` |
| `surface.roof-porch.edge`, `surface.roof-porch.soffit` | `dark-wood` |
| `surface.roof-sanctuary.concealed`, `surface.roof-sanctuary.edge`, `surface.roof-sanctuary.soffit` | `dark-wood` |
| `surface.roof-west.concealed`, `surface.roof-west.edge`, `surface.roof-west.soffit` | `dark-wood` |
| `surface.sanctuary.ceiling` | `dark-wood` |
| `surface.storage.ceiling`, `surface.storage.ceiling-back` | `dark-wood` |
| `surface.site-distant.ridge` | `distant-earth` |
| `surface.boundaries.footing`, `surface.boundaries.reveal` | `limestone` |
| `surface.facade-east.coping`, `surface.facade-east.footing`, `surface.facade-east.plinth`, `surface.facade-east.reveal` | `limestone` |
| `surface.facade-north.coping`, `surface.facade-north.footing`, `surface.facade-north.plinth`, `surface.facade-north.reveal` | `limestone` |
| `surface.facade-south.coping`, `surface.facade-south.footing`, `surface.facade-south.plinth`, `surface.facade-south.reveal` | `limestone` |
| `surface.facade-west.coping`, `surface.facade-west.footing`, `surface.facade-west.plinth` | `limestone` |
| `surface.site.curb` | `limestone` |
| `surface.administration.floor` | `paving-small` |
| `surface.colonnade.floor` | `paving` |
| `surface.courtyard.floor` | `paving` |
| `surface.entrance.floor` | `paving` |
| `surface.offering.floor` | `paving` |
| `surface.records.floor` | `paving-small` |
| `surface.sanctuary.floor` | `paving` |
| `surface.service-yard.floor` | `paving` |
| `surface.site.paving` | `paving` |
| `surface.storage.floor` | `paving-small` |
| `surface.administration.wall` | `plaster` |
| `surface.boundaries.bearing`, `surface.boundaries.joint` | `plaster` |
| `surface.colonnade.sanctuary-gable`, `surface.colonnade.wall` | `plaster` |
| `surface.entrance.pediment-back`, `surface.entrance.return` | `plaster` |
| `surface.facade-east.bearing`, `surface.facade-east.joint`, `surface.facade-east.outer` | `plaster` |
| `surface.facade-north.bearing`, `surface.facade-north.joint`, `surface.facade-north.outer`, `surface.facade-north.parapet-back` | `plaster` |
| `surface.facade-south.bearing`, `surface.facade-south.joint`, `surface.facade-south.outer`, `surface.facade-south.parapet-back` | `plaster` |
| `surface.facade-west.joint`, `surface.facade-west.outer`, `surface.facade-west.parapet-back`, `surface.facade-west.sanctuary-flank` | `plaster` |
| `surface.offering.wall` | `plaster` |
| `surface.records.wall` | `plaster` |
| `surface.roof-colonnade.bearing` | `plaster` |
| `surface.roof-east.bearing` | `plaster` |
| `surface.roof-porch.bearing` | `plaster` |
| `surface.roof-sanctuary.bearing` | `plaster` |
| `surface.roof-west.bearing` | `plaster` |
| `surface.sanctuary.wall` | `plaster` |
| `surface.service-yard.wall`, `surface.service-yard.wall-top` | `limestone` |
| `surface.storage.wall` | `plaster` |
| `surface.roof-colonnade.upper` | `roof-terracotta` |
| `surface.roof-east.upper` | `roof-terracotta` |
| `surface.roof-porch.upper` | `roof-terracotta` |
| `surface.roof-sanctuary.upper` | `roof-terracotta` |
| `surface.roof-west.upper` | `roof-terracotta` |
| `surface.site.earth`, `surface.site.ground` | `soil` |
| `surface.site-distant.ground` | `soil` |

Independent prototype parts such as columns, leaves, tiles, and basins remain in [model bindings](10-model-bindings.md#binding-map), not duplicated here. Textured spatial faces need finite producer UV0 and world-metre repeats; do not silently fall back after failure. Compare 01 porch/walls/tiles, 03 courtyard floor/band, 04 sanctuary ceiling, and 05 records floor under one daylight. Paving on exterior walls or plaster on courtyard floors is an immediate counterexample.

## Material transitions and concealed contacts {#material-junctions}

<!--
@evidence principles/core/common.md#declared-basis Uses ownership dado Y=0.60m, junction plinth/coping, and roof edge/soffit/upper subdivisions.
@evidence principles/core/common.md#scope-preservation Switches finishes only at existing wall/roof boundaries without ledges/new faces.
@evidence principles/core/common.md#substantive-completion Closes distinct coping/plaster, dado/void, roof-face, and concealed-bearing finish rules.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Distinguishes exposed finish/concealed contact on existing wall/roof subdivisions.
@evidence principles/design/materials.md#material-construction-appearance Hosts own actual plinth/coping/frames; materials defines only stone/plaster boundaries and concealed-bearing color.
@evidence principles/design/materials.md#material-binding-interface Switches keys by existing 0.60m dado/void and roof-face IDs.
@evidence principles/design/materials.md#material-verification-address Close exterior coping/eaves/sanctuary timber/ceiling/two dado thresholds test reversed finishes.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Compared existing 0.60m split, voids, and roof faces; material joins require no parent subdivision changes.
@evidence spaces/junctions.md#gable-closures Adds no physical patches where plaster gables meet clay uppers/timber edges/soffits.
@evidence spaces/junctions.md#wall-junctions Treats opposite wall faces as exposed finishes and concealed bearing/joint as base color.
@evidence spaces/openings.md#boundary-ownership Switches reveal stone/wall plaster at existing void boundaries.
@evidence spaces/roofs/assembly.md#roof-junctions Separates clay substrate, timber edge/soffit, and concealed plaster bearing.
@evidence spaces/storey.md#wall-ground-contact Keeps sloping plinth stone/soil/paving boundaries at existing ground contacts.
@evidence spaces/ownership.md#interior-dado Both 0.60m dados stop at existing subdivisions/voids without ledges.
-->

Stone/plaster transitions at plinths, coping, and doors follow member boundaries. Both red bands stop at [interior dado](../spaces/ownership.md#interior-dado) Y=0.60m and door voids without new volume/ledges. Outer plinth binds existing grade-following faces. Roof `upper` is tile substrate; `edge`/`soffit` timber; concealed wall/roof bearings are not exposed finishes. This avoids merging opposite physical-wall faces/contacts into one texture plane. Close coping corners, east/west eaves, upward sanctuary trusses/ceilings, and both dado thresholds test reversed finish, leaks, and duplicate bands.

## Material review samples {#material-review-set}

<!--
@evidence principles/core/common.md#declared-basis Uses delivery 1600×1000/50° frame, fixed daylight, and references 01~05.
@evidence principles/core/common.md#scope-preservation Owns finish observation samples without new geometry or response keys.
@evidence principles/core/common.md#substantive-completion Defines board front/diagonal/close views, five references, and workplace-threshold/yard-wall/coping failures.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns neutral frames into member/spatial boundary, repeat-length, and color-separation checks.
@evidence principles/design/materials.md#material-construction-appearance Separates physical stone/timber/plaster distinction from screen color/joints/roughness questions.
@evidence principles/design/materials.md#material-binding-interface Checks column/beam/hardware/tile parts and surface IDs with 2m/1m paving samples without taking geometry.
@evidence principles/design/materials.md#material-verification-address Defines reproducible 01~05 views, three workplace thresholds, yard sides, and board front/diagonal/close samples.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Consumes review-condition/daylight/spatial faces without changing parent cameras/lights/faces at material sampling.
@evidence obligations/core/common.md#purpose-fit Palette/part/face tables let users compare five reference finishes; this H2 closes reproducible samples.
@evidence obligations/core/common.md#production-language Three documents explain decisions/review conditions in English while retaining surface/part/key identifiers for operators.
@evidence obligations/design/materials.md#material-review-set Uses neutral daylight front/diagonal/close views of columns/beams/hardware/tiles, thresholds, and yard sides.
@evidence settings/00-delivery.md#delivery-scope Separately examines reusable building/interior/site materials in five reference scenes.
@evidence settings/00-delivery.md#governing-aim Tests continuous stone/plaster/timber/tile legibility in the same temple across five images.
@evidence settings/00-delivery.md#review-condition Uses neutral 1600×1000/vertical 50° and close exterior/interior samples.
@evidence settings/00-delivery.md#working-language Writes palette/binding/review conditions in English with original face/key identifiers.
@evidence settings/40-environment.md#daylight Compares one material frontally/diagonally/closely under fixed day/sky fill.
@evidence settings/50-production.md#fidelity Distinguishes architectural finish scrutiny from prop proxies rather than claiming photographic replication.
@evidence settings/50-production.md#references Uses provided 01~05 exterior/cutaway/courtyard/sanctuary/service finish comparisons.
@evidenceExclude settings/00-delivery.md#accessibility Captions, keyboard, focus, and readability are viewer operation; these H2s define only response/binding.
@evidenceExclude settings/00-delivery.md#coverage-map Settings fact-owner guidance defines neither material faces nor response; this layer consumes actual 20-envelope statements separately.
@evidenceExclude settings/00-delivery.md#operative-subjects Actors/allowed operations are not fixed finish keys/states; reusable materials adds no actor/motion.
@evidenceExclude settings/00-delivery.md#operator-access Viewer owns operator controls/labels/inspection; material review consumes only 1600×1000 samples.
@evidenceExclude settings/10-building.md#civic-identity Nonassertive faith/dynasty identity belongs to settings; palette defines observable finishes only.
@evidenceExclude settings/10-building.md#scale 410~450㎡ outline/aspect are spatial footprint checks; keys choose no area or plan dimensions.
@evidenceExclude settings/50-production.md#acceptance Independent judgment/stage authority are procedure, not finish construction/binding/light response.
@evidenceExclude settings/50-production.md#author-commits Commit/push procedures are not material key/repeat inputs.
@evidenceExclude settings/50-production.md#execution-authority Production/install authority are procedure, not building-face decisions consumed by 20 finish H2s.
@evidenceExclude settings/50-production.md#gpu-observation GPU renderer checking is later measurement; this draft consumes neutral camera/light from review-condition/daylight.
@evidenceExclude settings/50-production.md#measurement-truth Compiled ID/position truth is implementation verification; materials authors stable IDs/keys only.
@evidenceExclude settings/50-production.md#runtime-boundary CJS/ESM/payload rules are implementation, not finish physical layers/UV/keys.
@evidenceExclude spaces/building.md#approach-contacts Building contacts/two nodes are spatial navigation; this table consumes emitted site.paving/curb faces there only.
@evidenceExclude spaces/building.md#footprint Outline/410~450㎡ belong to spaces; materials binds resulting IDs only.
@evidenceExclude spaces/circulation.md#public-route Public walking paths/widths are spatial circulation; materials only assigns paving to emitted floors.
@evidenceExclude spaces/circulation.md#service-route Service access sequence is circulation; yard floor/wall keys come from the separate binding table.
@evidenceExclude spaces/observations.md#geometry-observations Spatial dimensions, cuts, and contacts are geometry review; material samples independently judge color/repeats/joins.
@evidenceExclude spaces/observations.md#viewer-path Viewer camera routes/controls belong to spatial review; materials uses neutral review-condition frames.
@evidenceExclude spaces/site.md#placement-zones Neighbor/tree positions/repetition belong to instances; materials defines prototype part finishes.
@evidenceExclude spaces/site.md#site-connections Site nodes/exterior connections are spatial/map contacts; materials assigns only site.paving finish.
@evidenceExclude spaces/site.md#site-extent Site boundaries/25m extent belong to spaces; materials consumes emitted earth/paving/ridge faces.
-->

Use [review frame](../settings/00-delivery.md#review-condition) 1600×1000/vertical 50° and [daylight](../settings/40-environment.md#daylight) fixed day/sky fill. Board samples view column stone, timber beam, door hardware, one tile, and 2m paving frontally/diagonally/closely. Building compares 01 exterior, 02 cutaway face allocation, 03 courtyard, 04 sanctuary, and 05 records/service separately. Yard low north/east inner walls and high sanctuary/storage yard faces/coping read as stone distinct from north/east exterior plaster. At all three workplace thresholds compare four-cell periods of 1m paving and 2m colonnade paving. Equal joint spacing, orthogonal grids beyond tile geometry, swapped frame/leaf materials, red bands leaking beyond rooms, merged ceiling/plaster colors, or indistinct paving/earth/water fails. Claim no photographic damage replication. Rejudge these conditions after actual material source/placement exists.
