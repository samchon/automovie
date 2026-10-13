# Common material frame

## Color space and linear conversion {#material-color-space}
<!--
@evidence principles/core/common.md#declared-basis Hex is authored under visual-grammar; linear RGB derives from the stated IEC 61966-2-1 equation rather than photographic sampling.
@evidence principles/core/common.md#scope-preservation This unit owns color conversion; lighting-state retains exposure and white balance.
@evidence principles/core/common.md#substantive-completion Both transfer branches, three-decimal linear notation, hex precedence, and color-texture interpretation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The palette relationships gain numeric hex choices and reproducible linear conversion.
@evidence principles/design/materials.md#material-construction-appearance Renderer-facing appearance notation is separate from each finish's physical assembly.
@evidence principles/design/materials.md#material-binding-interface Base color is scene-linear RGB, so source/host owners need not infer input color space.
@evidence principles/design/materials.md#material-verification-address Conversion comparison and neutral-light distinction among siding/trim/ceiling whites can falsify the convention.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work reference-authority prohibits pixel sampling, visual-grammar supplies palette relationships, and lighting-state fixes exposure. These suffice for the conversion rule without parent revision.
@evidence contracts/texture-readability.md#material-texture-readability Color maps and hex fallback share sRGB interpretation without changing color space during loading.
@evidence obligations/core/common.md#production-language The four material documents use English; hex and linear notation remain language-independent numbers.
@evidence obligations/core/common.md#purpose-fit One convention supports consistent house-wide material readability in actual 3D without claiming photographic reproduction.
@evidence obligations/design/materials.md#addressable-material-decisions Color, texture, response, binding, and review have separate frame H2s; independently assigned finishes retain their own H2s.
@evidence settings/00-production.md#governing-aim Consistent color supports readable materials throughout the same house's exterior and interiors.
@evidence settings/20-verification.md#lighting-state Materials does not compensate for per-view exposure or white balance.
@evidence settings/20-verification.md#reference-authority Hex values interpret the reference relationships rather than sampled photograph pixels.
@evidence settings/20-verification.md#visual-grammar Warm-white siding, charcoal, white trim, brick, wood, and neutral textiles share this numeric color convention.
@evidenceExclude settings/00-production.md#accessibility Named controls and non-color-only inspection results are viewer duties; materials implements no alternative-access control.
@evidenceExclude settings/00-production.md#coordinate-units World placement/transforms remain spaces/model decisions; finishes receive their metric coordinates without a second world frame.
@evidenceExclude settings/00-production.md#coverage-map The canon map supplies no additional finish value beyond the cited material settings owners.
@evidenceExclude settings/00-production.md#delivery-scope Deliverable and omitted film/person/vehicle scope supplies no independent finish parameter or surface assignment.
@evidenceExclude settings/00-production.md#operative-subjects The subject/resource inventory introduces no additional material face; bindings receive named model/space surfaces.
@evidenceExclude settings/00-production.md#operator-access Camera/observation controls remain viewer behavior without finish constants or binding keys.
@evidenceExclude settings/00-production.md#use-profile Occupant/basket dimensions and passage widths remain geometry checks; materials constructs no occupancy body.
@evidenceExclude settings/10-house.md#common-room Continuous-room topology and seating allocation remain spatial/model/instance decisions; materials receives existing surface partitions.
@evidenceExclude settings/10-house.md#house-scale Area and outline targets supply no finish parameter; materials changes/measures no floor area.
@evidenceExclude settings/10-house.md#main-mass Roof hierarchy and clear heights remain geometry; finishes receive handed-over slope faces.
@evidenceExclude settings/10-house.md#service-band Service topology and garage connection supply no independent finish value or face.
@evidenceExclude settings/20-verification.md#completion-boundary Completion judgment and full observation are process duties without another color/binding value; materials makes no visual completion claim.
@evidenceExclude settings/20-verification.md#data-authority Measurement authority governs later reports; material design authors no compiled measurement report.
@evidenceExclude settings/20-verification.md#execution-boundary CommonJS/server boundaries supply no renderer-facing finish parameter.
@evidenceExclude settings/20-verification.md#implementation-boundary Edit/dependency procedures determine no finish color, response, or surface compatibility.
@evidenceExclude settings/20-verification.md#observation-allocation Complete room-question derivation remains spaces/source work; material samples allocate no room pose.
@evidenceExclude settings/20-verification.md#role-boundary Author/observer/supervisor authority governs process rather than additional finish values or faces.
@evidenceExclude settings/20-verification.md#submission-boundary Commit/push procedures have no optical or material-design realization.
@evidenceExclude settings/20-verification.md#validation-boundary Canonical commands belong to production wiring; materials reconfigures no command.
@evidenceExclude settings/20-verification.md#viewer-handoff Server launch/port/URL handoff has no finish value or face binding.
@evidenceExclude spaces/00-building.md#attached-garage-extent Garage outlines/shared-wall construction remain geometry; finishes receive existing faces through the surface handoff.
@evidenceExclude spaces/00-building.md#main-building-extent Outline, wall reservations, and area arithmetic remain spatial dimensions unchanged by finishes.
@evidenceExclude spaces/01-storeys.md#ground-threshold-datums Porch/garage heights and steps remain geometry; materials receives existing top/riser faces without choosing datums.
@evidenceExclude spaces/01-storeys.md#storey-datums Storey heights/structural reservations remain spatial; finishes assign response without a new datum.
@evidenceExclude spaces/02-stair.md#stair-clearance Clear width and occupancy checks remain geometry; coating changes no stair reservation.
@evidenceExclude spaces/02-stair.md#stair-connector-handoff Connector routes/landings introduce no finish key; materials constructs no connector.
@evidenceExclude spaces/02-stair.md#stair-floor-opening The L-shaped hole/protection plan remains spatial; finished coordinates arrive through the complete-face handoff.
@evidenceExclude spaces/04-observations.md#engine-render-handoff Environment lowering/visible-element generation remains source work; materials creates no second house.
@evidenceExclude spaces/04-observations.md#spatial-observation-derivation Pose containment/question generation remains observation work rather than finish assignment.
@evidenceExclude spaces/05-route-network.md#room-route-network Route order and adjacency/passage distinctions remain topology; materials adds no route edge.
@evidenceExclude spaces/06-openings.md#external-opening-interface Rough openings/depth reservations feed window/door prototypes; materials consumes their partitions without redefining openings.
@evidenceExclude spaces/07-boundary-assembly.md#exterior-boundary-junctions Single exterior junction bodies remain geometry; materials receives elevation faces/corner-trim partitions through their existing handoffs.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-ownership Shared partitions remain spatial construction; materials receives room finishes without generating another wall.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-edge-junctions Structural rims and wall/floor contacts remain geometry; their material faces arrive through complete-owner handoffs.
@evidenceExclude spaces/09-ceiling-assembly.md#ceiling-roof-clearance Clearance arithmetic supplies no finish parameter; response preserves roof/ceiling boundaries.
@evidenceExclude spaces/09-ceiling-assembly.md#garage-ceiling-closure Garage ceiling/travel clearance remains geometry; paint consumes the existing room face.
@evidenceExclude spaces/10-ground-floor.md#garage-ground-floor-base Garage substrate/support remains spatial; concrete response binds to the exposed top.
@evidenceExclude spaces/10-ground-floor.md#ground-support-handoff Pending ground/foundations supply no adopted finish height; materials invents no ground.
@evidenceExclude spaces/10-ground-floor.md#ground-threshold-junctions Substrate/threshold geometry remains spaces-owned; trim receives named threshold faces through the complete-owner handoff.
@evidenceExclude spaces/envelope/front.md#bedroom-three-front-window Right-bedroom void placement remains spatial; the window prototype/front-openings supplies material interfaces instead.
@evidenceExclude spaces/envelope/front.md#bedroom-two-front-window Left-bedroom void placement remains spatial; materials receives window faces without another opening decision.
@evidenceExclude spaces/envelope/front.md#front-entry-filling Entry placement/threshold producer remains spatial/model work; materials consumes prototype partitions and the complete-face handoff.
@evidenceExclude spaces/envelope/front.md#front-roof-closures Front wall/gable closure remains elevation geometry; finishes receive existing exposed faces.
@evidenceExclude spaces/envelope/front.md#garage-front-opening Garage void/travel remains geometry; panel/rail finishes consume the garage-door prototype.
@evidenceExclude spaces/envelope/front.md#living-front-window Porch-window placement remains spatial; materials receives existing elevation/window interfaces.
@evidenceExclude spaces/envelope/front.md#stair-front-window Stair-window binding/coordinates remain spatial; the fixed prototype supplies material faces.
@evidenceExclude spaces/envelope/left.md#left-roof-closure Left gable/base closure remains elevation geometry; finishes consume existing faces through the complete handoff.
@evidenceExclude spaces/envelope/left.md#living-left-window Living side-window placement remains spatial; binding consumes its stable prototype partitions.
@evidenceExclude spaces/envelope/left.md#primary-left-window Primary side-window coordinates remain spatial; materials receives frame/glazing without another location.
@evidenceExclude spaces/envelope/rear.md#family-rear-window Family rear-window coordinates/room binding remain spatial; materials derives no second position.
@evidenceExclude spaces/envelope/rear.md#garden-door Door opening/waiting areas remain geometry; materials receives paired-door partitions and threshold faces through the complete handoff.
@evidenceExclude spaces/envelope/rear.md#kitchen-rear-window Counter/window clearance remains geometry; finish response determines neither appliance nor window position.
@evidenceExclude spaces/envelope/rear.md#primary-rear-window Primary rear-window placement remains spatial; window/curtain prototypes provide material faces.
@evidenceExclude spaces/envelope/rear.md#rear-roof-closures Rear wall/roof-step closure remains geometry rather than a new finish outline.
@evidenceExclude spaces/envelope/right.md#family-right-window Family side-window position remains spatial; finishes consume resulting prototype faces.
@evidenceExclude spaces/envelope/right.md#garage-right-window Garage side-window placement/rail clearance remains geometry without independent finish values.
@evidenceExclude spaces/envelope/right.md#right-roof-closures Right gable/shared-wall closure remains geometry unchanged by response.
@evidenceExclude spaces/roof/00-junctions.md#roof-mass-allocation Roof zones remain spatial; shingle/trim receives slope owners rather than another roof group.
@evidenceExclude spaces/roof/00-junctions.md#roof-profile-datums Heights/pitches/thickness remain spatial inputs unchanged by finish response.
@evidenceExclude spaces/roof/00-junctions.md#roof-shared-edges Valley/step construction remains geometry; materials receives UV/cuts through the complete slope handoff.
@evidenceExclude spaces/roof/00-junctions.md#roof-wall-head-junctions Wall-head/roof contacts remain geometry; finishes use already closed faces.
@evidenceExclude spaces/roof/front-gable-left.md#front-gable-left-roof Left gable geometry remains with its owner; the shared slope handoff supplies the metric finish interface.
@evidenceExclude spaces/roof/front-gable-right.md#front-gable-right-roof Right gable/stair-window clearance remains geometry; materials rebuilds no slope or opening.
@evidenceExclude spaces/roof/garage-back.md#garage-back-roof Garage-back slope/window interference remains construction; finishes consume the shared slope interface.
@evidenceExclude spaces/roof/garage-front.md#garage-front-roof Garage-front roof/door/ceiling sections remain spatial construction without another finish datum.
@evidenceExclude spaces/roof/main-back.md#main-back-roof Main rear ridge/eave boundaries remain geometry; materials receives the existing complete face.
@evidenceExclude spaces/roof/main-front.md#main-front-roof Main-front valley/chimney cuts remain geometry; repeat patterns end at existing cuts.
@evidenceExclude spaces/roof/right-back.md#right-back-roof Low rear ceiling/step interfaces remain geometry unchanged by finishes.
@evidenceExclude spaces/roof/right-front.md#right-front-roof Low front slope remains geometry; existing faces receive shingle/trim without another plate.
@evidenceExclude spaces/rooms/bedroom-three.md#bedroom-three-furniture-use Furniture/circulation placement remains spatial; materials consumes bedding/model faces without placing objects.
@evidenceExclude spaces/rooms/bedroom-three.md#bedroom-three-plan Notched room outline/entrance remains geometry; the complete interior handoff supplies finish zones.
@evidenceExclude spaces/rooms/bedroom-two.md#bedroom-two-furniture-use Bed/desk/closet use reservations supply no independent finish value; materials preserves their occupancy.
@evidenceExclude spaces/rooms/bedroom-two.md#bedroom-two-plan Bedroom outline/entrance remains geometry; materials receives existing room-side faces.
@evidenceExclude spaces/rooms/common.md#common-clear-routes Kitchen/garden circulation strips remain occupancy checks without new finish faces.
@evidenceExclude spaces/rooms/common.md#common-dining-reservation Six-seat repetition/use remains spatial/model/instance work; materials places no seats.
@evidenceExclude spaces/rooms/common.md#common-family-reservation Family seating/rug/window access remains spatial; materials receives named textile/furniture faces.
@evidenceExclude spaces/rooms/common.md#common-island-reservation Island footprint/seat pitch/work remains geometry; the prototype supplies cabinet/stone/metal faces.
@evidenceExclude spaces/rooms/common.md#common-kitchen-wall-reservation Appliance/cabinet placement remains spatial; materials receives model faces without another kitchen layout.
@evidenceExclude spaces/rooms/common.md#common-room-plan Continuous-room outline/entrances remain geometry; the shared handoff supplies room-side faces.
@evidenceExclude spaces/rooms/entry.md#entry-coat-storage Under-stair closet envelope/opening remains spatial; storage prototypes provide leaf/rod/shelf faces.
@evidenceExclude spaces/rooms/entry.md#entry-plan Entry outline/swing remains geometry; the complete handoff supplies finish zones.
@evidenceExclude spaces/rooms/entry.md#entry-use-routes Mat placement/distribution remains occupancy; materials chooses no new route or mat position.
@evidenceExclude spaces/rooms/garage-interior.md#garage-storage-use Shelf/workbench placement remains spatial; finishes receive partitions without changing clear floor area.
@evidenceExclude spaces/rooms/garage-interior.md#garage-use-routes Garage access/basket turns remain occupancy checks rather than material constants.
@evidenceExclude spaces/rooms/laundry.md#laundry-equipment-use Machine/bench placement and sequential use remain spatial; materials receives existing partitions.
@evidenceExclude spaces/rooms/laundry.md#laundry-plan Laundry outline/two-door topology remains geometry unchanged by response.
@evidenceExclude spaces/rooms/laundry.md#laundry-through-route Mudroom crossing/door sequencing remains passage checking; materials makes no second route.
@evidenceExclude spaces/rooms/living.md#living-plan Living outline/entrances/windows remain geometry; room-side faces arrive through the shared handoff.
@evidenceExclude spaces/rooms/living.md#living-through-route Front-to-back circulation remains occupancy without another material face or value.
@evidenceExclude spaces/rooms/pantry.md#pantry-plan Pantry outline/shelf plan/door remains geometry; floor/shelf faces arrive from existing owners.
@evidenceExclude spaces/rooms/pantry.md#pantry-storage-use Food/shelf occupancy remains spatial; materials invents no inventory or placement.
@evidenceExclude spaces/rooms/pantry.md#pantry-use-route Retrieval/turning remains occupancy checking rather than finish response.
@evidenceExclude spaces/rooms/powder.md#powder-plan Powder outline/single entrance remains geometry; the room handoff supplies finish faces.
@evidenceExclude spaces/rooms/primary.md#primary-plan Primary outline/doors/windows remains geometry; materials changes no topology or window position.
@evidenceExclude spaces/rooms/service.md#service-access-plan The L-shaped passage remains geometry; materials receives existing wall/floor faces.
@evidenceExclude spaces/rooms/tub-bath.md#tub-bath-plan Tub-room outline/entrance remains geometry; room/fixture owners supply finish zones.
@evidenceExclude spaces/rooms/upper-hall.md#upper-hall-plan Hall outline/five room connections remains geometry; materials adds no hall or door edge.
@evidenceExclude spaces/rooms/upper-hall.md#upper-linen-storage Linen envelope/opening/shelf repetition remains geometry; storage prototypes provide binding ids.
@evidenceExclude spaces/rooms/wardrobe.md#primary-wardrobe-plan Walk-in wardrobe topology remains spatial; materials receives room/fitting faces.
@evidenceExclude spaces/rooms/wardrobe.md#wardrobe-storage-use Hanging/folded occupancy remains spatial allocation; materials places no clothes or shelves.
@evidenceExclude spaces/site/00-access.md#map-handoff-inputs Pending parcel/ground/network inputs remain spatial; materials invents no geometry or height.
@evidenceExclude spaces/site/00-access.md#site-access-interface Node/port placement remains topology; paving receives existing faces without defining network ends.
@evidenceExclude spaces/site/00-access.md#site-local-routes Exterior route order/zone heights remains spatial; materials constructs no connection.
@evidenceExclude spaces/site/01-paving-support.md#paving-contact-handoff Ground/foundation/paving support remains geometry; materials preserves exposed finish boundaries.
@evidenceExclude spaces/site/01-paving-support.md#raised-platform-support Platform/column supports remain construction; finishes receive existing top/riser/side faces.
@evidenceExclude spaces/site/fence.md#fence-gate-junction Posts/panels/gate void remain geometry; finishes consume existing fence/gate partitions.
@evidenceExclude spaces/site/fence.md#fence-ground-profile Ground-dependent height/post occupancy remains spatial; materials adopts no pending ground value.
@evidenceExclude spaces/site/side-walk.md#side-gate-interface Waiting/swing/clear width remains spatial; wood/metal consumes the separate gate prototype.
@evidenceExclude spaces/site/side-walk.md#side-walk-plan Service-walk outline/interpolation remains geometry; paving binds to existing exposed faces.
@evidenceExclude spaces/site/terrace.md#garden-lower-landing-plan Landing dimensions/ground contact remains geometry; materials defines no second landing.
@evidenceExclude spaces/site/terrace.md#garden-steps-plan Garden step count/depth remains geometry; paving receives existing tread/riser faces.
@evidenceExclude spaces/site/terrace.md#garden-terrace-plan Terrace/waiting/dining placement remains spatial; response changes no platform or object placement.
@evidence settings/00-production.md#working-language The owner's English decision governs these documents/explanations; exact paths and numbers retain their identities.
-->

Author every material's reference color as an 8-bit sRGB hex. Renderer-facing base color is that hex linearized with the IEC 61966-2-1 sRGB transfer function: for channel c in 0–1, use c / 12.92 when c ≤ 0.04045 and ((c + 0.055) / 1.055)^2.4 otherwise. Each material H2 records hex and linear RGB to three decimal places. If they disagree, hex is authored and linear RGB is derived; source recalculates from hex before comparison. Generated color textures use the same sRGB interpretation as fallback.

Under [reference authority](../settings/20-verification.md#reference-authority), these are numeric interpretations of [common material and envelope relationships](../settings/20-verification.md#visual-grammar): warm-white siding, deep charcoal, white trim, red-brown brick, honey/mid-brown wood, and gray-beige textiles. They are not photograph pixel samples. Output is sRGB under [fixed exposure and white balance](../settings/20-verification.md#lighting-state); materials do not compensate for individual views. Current source owner is `src/materials/finish.ts`, calling public `srgbHexToLinearColor`. Review compares conversion values and the distinction among siding/trim/ceiling whites on the neutral plate.

## Surface grain, optical response, and texture binding {#material-texture-response}
<!--
@evidence models/00-model-frame.md#model-furniture-local-frame Host metric UV axes/origins and per-H2 precedence carry physical repeat lengths; materials does not recreate coordinates.
@evidence models/00-model-frame.md#model-representation-ceiling Actual glass/window/leaf thickness remains geometry; texture does not recreate excluded screws/weatherstrips.
@evidence principles/core/common.md#declared-basis The user's reversal of the bitmap hold authorizes deterministic texture and smooth optical readability.
@evidence principles/core/common.md#scope-preservation Siding/shingle thickness remains models/instances; materials owns grout masks/response and systems owns emission.
@evidence principles/core/common.md#substantive-completion Metric modules, projection, origins/seams, fallback limits, and actual scale-check population are specified without claiming execution.
@evidence principles/core/inherited-units.md#derived-parent-differentiation fidelity's readable members gain material-owned texture scale and explicit smooth optical decisions.
@evidence principles/design/materials.md#material-construction-appearance Member overlap/thickness is geometry; grain and transmission are appearance response.
@evidence principles/design/materials.md#material-binding-interface Stable part ids and metric UVs bind repeat modules without transferring geometry ownership.
@evidence principles/design/materials.md#material-verification-address Views at 1 m/2 m and review distance test grain, seams, scale, and optics; fallback is not acceptance.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work fidelity/visual-grammar supplies finish readability; the model frame supplies metric coordinates and omitted-detail limits. This convention changes no parent geometry.
@evidence contracts/texture-readability.md#material-texture-readability Repeated faces require grain/scale/seams; smooth faces require optics, and failed loads remain fallback only.
@evidence obligations/core/common.md#proportionate-development Repeated-grain surfaces receive physical texture plans; smooth glass/mirrors receive optics rather than decorative patterns.
@evidence settings/20-verification.md#fidelity Actual readability becomes deterministic texture/optical decisions with incomplete realization explicit.
-->

The user's reversal of the bitmap hold permits textures/optics to realize [fidelity](../settings/20-verification.md#fidelity). Models/instances make thickness/junctions explaining siding courses and shingle overlap. Materials makes brick/tile joints as deterministic color, roughness, and normal masks in existing UVs, without separate grout geometry. Glass, mirrors, and glaze read through transmission/reflection/curved highlights rather than arbitrary patterns. Systems retains emission. Reference images are not pasted onto surfaces; pixels come from reviewable TypeScript formulas and named physical parameters.

Each H2 defines partitions, repeat modules in meters, use of host U/V axes, origins, rotations/seams, and reference-color fallback. World walls default to wall-length U/height V, floors to X/Z, roofs to eave-parallel U/up-slope V, and model members to declared local axes. Physical-scale review must inspect actual binding `coordinateSource` and UVs rather than an empty population; this translation ran no scale check and claims no corresponding validator API exists. Missing/failed maps retain diagnostic color/roughness and cannot pass final readability.

Current shared declarations are in `src/materials/finish.ts`; selection is in `model-bindings.ts` and `space-bindings.ts`. Existing color PNGs come from `src/materials/generate-building-textures.mts` and `src/viewer/generate-preview-textures.mts`, with furniture grain in `src/materials/furnishings/wood-grain.mts`. Native `src/viewer/scene.mts` binds color maps and constant roughness, not roughness or normal maps. A registered module/existing PNG does not establish full realization of the plans below. Close/review-distance GPU acceptance remains unverified in this translation work.

## Roughness and metallic conventions {#material-response-conventions}
<!--
@evidence principles/core/common.md#declared-basis Bands are authored gloss hierarchy under afternoon key/sky fill, not measured BRDF data.
@evidence principles/core/common.md#scope-preservation This unit owns gloss/metallicity; systems retains emission/intensity.
@evidence principles/core/common.md#substantive-completion Four roughness bands, exposed-metal metallic 1.0, coating metallic 0.0, and optical exceptions are stated.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state delegates response; this unit adds numeric bands and bare-metal/coating interpretation.
@evidence principles/design/materials.md#material-construction-appearance Frames/panels/balusters are metal construction with dielectric coating response, hence metallic 0.0.
@evidence principles/design/materials.md#material-binding-interface Transmission remains scoped to named glass/curtain/diffuser faces rather than opaque host surfaces.
@evidence principles/design/materials.md#material-verification-address Same-light spheres can falsify the intended highlight-width hierarchy.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Afternoon key/sky fill/fixed exposure suffice for the gloss comparison without revising lighting state.
@evidence contracts/texture-readability.md#material-texture-readability Planned roughness variation retains bounded response and intended gloss order.
@evidence obligations/design/materials.md#material-response Bands and scoped metallic/transmission rules allocate renderer-facing response.
@evidence settings/20-verification.md#lighting-state Common light supplies the comparison conditions for roughness bands.
@evidence settings/20-verification.md#renderer-boundary Linear color/optics feeds actual 3D; systems-owned light is not replaced with emissive panels.
-->

Reference roughness uses 0–1 values: glossy glass/mirrors 0.02–0.05; semi-gloss paint/enamel/ceramic 0.25–0.40; matte wall paint/oiled wood 0.45–0.65; brick/concrete/shingle/textiles 0.80–0.95. Planned local variation preserves the chosen band and gloss hierarchy. Metallic is 1.0 only for unpainted exposed metal: stainless appliances, faucets, and mirror silver. Painted frames, garage panels, black balusters, and handles use metallic 0.0 because the visible surface is coating.

These are authored bands under [afternoon key and sky fill](../settings/20-verification.md#lighting-state), not measured BRDF. An H2 outside a band explains its response. Explicit privacy-glass, curtain, and fixture optical values are exceptions to the general transparent-glass transmission convention; their named faces retain those values rather than becoming opaque. Source owner is `src/materials/finish.ts`. Review compares highlights under the same light against the intended band order.

## Surface binding rules {#material-binding-rule}
<!--
@evidence models/00-model-frame.md#model-local-frame Prototype faces retain origin frames/world placement; binding changes neither envelope nor transforms.
@evidence models/00-model-frame.md#model-surface-partition-naming Role ids and inner/outer suffixes select final finishes, including thickness/cut faces.
@evidenceExclude models/00-model-frame.md#model-reference-scale Door/glazing clear-width checks remain geometry; binding constructs no occupancy body or opening measurement.
@evidence principles/core/common.md#declared-basis Complete exterior/interior face handoffs supply finish host owners.
@evidence principles/core/common.md#scope-preservation Materials assigns response without changing outlines, thickness, or face count.
@evidence principles/core/common.md#substantive-completion Final finish uniqueness, internal grout masks, member-boundary alignment, and sidedness are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-allocation supplies inherited binding; this unit adds member-end and normal-direction conditions.
@evidence principles/design/materials.md#material-construction-appearance Finish transitions follow actual trim/threshold/baseboard/plinth ends rather than invented construction seams.
@evidence principles/design/materials.md#material-binding-interface Existing ids/UVs/normals define compatibility; materials receives these interfaces.
@evidence principles/design/materials.md#material-verification-address Missing/ambiguous bindings or disagreement with member ends can falsify the rule in actual output/views.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Complete face handoffs and model role ids suffice for finish selection without another host geometry.
@evidence contracts/texture-readability.md#material-texture-readability Coordinates and finish bind to the same stable part and end at its boundary.
@evidence obligations/core/common.md#layer-boundary Materials retains response; spaces/models retains geometry/coordinate ownership.
@evidence obligations/design/materials.md#material-surface-assignment Unique finish, internal masks, member-end alignment, and direction apply across all bindings.
@evidence spaces/03-surface-owners.md#exterior-surface-handoff Complete elevation/roof/porch/threshold/site owners supply exterior faces.
@evidence spaces/03-surface-owners.md#interior-surface-handoff Room owners supply wall/floor/ceiling/opening-surround finish zones.
@evidence settings/20-verification.md#surface-allocation Finishes inherit the complete-surface responsibility shared with geometry/repetition.
@evidence settings/00-production.md#build-allocation Response remains materials work; prototypes/repeated placement remain models/instances work.
-->

Materials binds to faces assigned by the [complete exterior handoff](../spaces/03-surface-owners.md#exterior-surface-handoff) and [room interior handoff](../spaces/03-surface-owners.md#interior-surface-handoff), preserving outline, thickness, and count. Every face receives exactly one final material instance. Different finishes meet at existing member boundaries: trim projection, threshold, baseboard, or plinth top. Brick/tile grout is a UV color/roughness/normal mask inside that final material, not a second material on the face. Arbitrarily painting different triangles must not invent construction boundaries.

Maps bind to the same part id and receive host U/V axes, origins, rotations/seams; materials owns repeat dimensions. Normals remain host-owned. Single-sided is default; glass/thin curtains use explicit double-sided response. Current owners are `src/materials/model-bindings.ts` and `src/materials/space-bindings.ts`; `wall-tile-partitions.ts` clips declared finish zones in existing triangles, preserving positions/normals/UVs/total area rather than adding walls. Review asks for 0 unbound or multiply bound faces and checks member-end alignment. Resolver rejection alone proves neither that every intended surface was emitted nor that it was visually reviewed.

## Material review samples {#material-review-set}
<!--
@evidence models/03-interior-doors.md#interior-door-hinges All 11 doors retain low/high hinge assignments and reference π/2 pose while finishes are compared from both rooms.
@evidence models/00-model-frame.md#model-representation-completion Sample success remains separate from closed-volume/reservation-fit judgment.
@evidence models/00-model-frame.md#model-review-set Same-camera face-id/material pairs test leakage under existing allowed poses.
@evidence principles/core/common.md#declared-basis frame-condition supplies raster/background; lighting-state supplies shared reference light.
@evidence principles/core/common.md#scope-preservation This unit defines material samples; poses/results come from compiled output/current GPU frames.
@evidence principles/core/common.md#substantive-completion Neutral/baseline/distance/state samples retain unverified status when absent or failed.
@evidence principles/core/inherited-units.md#derived-parent-differentiation View defaults gain 0.5 m sphere/plate samples and a neutral-light comparison plan.
@evidence principles/design/materials.md#material-construction-appearance Close samples test member/grain scale; shared-light samples separately test color/gloss.
@evidence principles/design/materials.md#material-binding-interface Actual-host distance views compare finish/member ends rather than detached swatches alone.
@evidence principles/design/materials.md#material-verification-address White/roughness comparisons expose merged colors and unsupported gloss order instead of assuming the declared order passed.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Raster/common-light parents suffice for reproducible samples without revising room poses or geometry.
@evidence contracts/texture-readability.md#material-texture-readability Close/review-distance actual-host samples test grain scale/seams and smooth optics.
@evidence obligations/design/materials.md#material-review-set Neutral/baseline/distance/state samples test tiling/boundaries/face errors before dramatic composition.
@evidence settings/20-verification.md#frame-condition Raster 1536×1024, eye heights/FOV, and neutral background remain inherited.
@evidence settings/20-verification.md#lighting-state Baseline comparison retains afternoon key/sky fill/warm interior lights.
@evidence settings/20-verification.md#lifecycle-boundary Readability samples belong to cleanup after space/member work without replacing geometry judgment.
-->

Judge materials with fixed samples before dramatic composition. The neutral-light plan uses [frame conditions](../settings/20-verification.md#frame-condition): canvas 1536×1024, neutral background, one 0.5 m sphere and 0.5 m plate per material H2, a directional light equivalent to 6500 K, uniform ambient light, and fixed exposure. Its intended brightness order is white trim > ceiling > interior wall > siding and charcoal frames < garage door, with roughness-band highlight-width comparison. Current constants do not establish that intended white order: ceiling `#FAF9F6` has higher linear channels than exterior trim `#F6F4EE`. Preserve both colors and inspect their distinction; do not silently change them or claim the order passed. Current neutral source uses white key/fill, not a calibrated temperature measurement.

The baseline plan repeats the array under [afternoon key/sky fill and lit warm interiors](../settings/20-verification.md#lighting-state), testing whether whites merge or olive/blue-gray bedding loses distinction. Exterior samples use 01 at eye height 1.6 m/about 20 m plus a view 2 m from the wall. Interiors use each room threshold at 1.6 m above floor/vertical FOV 60° plus furniture views at 1 m. Inspect finish/member boundaries, missing/duplicate bindings, physical scale/seams, and smooth optics. State samples retain one static baseline without wetness/wear/time changes and additionally inspect leaf edges in allowed opening states. `src/materials/review.ts` owns samples. Poses/results come from compiled output/current GPU frames; missing/failed plates remain unverified.

The building plate consumes the 36 actual `buildingFinishes` entries without substitute swatches or duplicated ids. `subject=material-review` begins at `page=0`, seven rows per page, retaining the last single row. Each row has a diameter 0.5 m sphere on the left and a 0.5×0.5 m plate on the right. `mode=neutral` uses white key/uniform fill; `mode=baseline` uses actual HouseLighting sources/positions/environment with unchanged camera/geometry. `materialReview.rows` and native inspection preserve emitted id order. Where primitive tessellation lacks UVs, the sample owner supplies metric meridian/latitude or plate-plane coordinates divided by the original finish module. This building observation does not complete unbuilt individual object materials.

The mirror plate preserves the actual FittingParts +Z front producer and `mirror` semantics of the sanitary host, using native planar reflection. The sphere tests identical metallic PBR values without a newly authored curved mirror. Current viewer has no curved environment reflection, so a dark sphere front is not a failed planar mirror; reflection is judged on the plate and actual sanitary host. No texture/optical constant changes hide that difference. This translation made no new GPU material capture.
