# Exterior and interior finishes

## Envelope assembly {#envelope-assembly}

<!--
@evidence principles/core/common.md#declared-basis This unit binds the four elevation owners and three roof owners to the authored siding, brick, charcoal, trim, glazing, door, porch, chimney, and garage finish assignments.
@evidence principles/core/common.md#scope-preservation The finish bindings preserve model wall, opening, roof, porch, chimney, and garage geometry instead of using materials to redefine any boundary.
@evidence principles/core/common.md#substantive-completion The envelope paragraph names every visible exterior material family and its source owner, including the siding-over-brick ordering and the attached garage treatment.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This H2 turns settings' visual grammar and model surface owners into concrete finish bindings while leaving host geometry with models and spaces.
@evidence principles/design/materials.md#material-construction-appearance The exterior assignment separates construction layer order from the later renderer response and records the brick skirt, siding, trim, glazing, and roof roles.
@evidence principles/design/materials.md#material-binding-interface Each named finish is carried by the source Part MaterialId and lowered through the existing material vocabulary rather than through a second geometry owner.
@evidence principles/design/materials.md#material-verification-address The elevation and roof surface-owner ids, module law ids, opening ids, and neutral exterior observations make each envelope assignment independently addressable.
@evidence obligations/core/common.md#purpose-fit The exterior finish population supplies the visible material distinctions required for the reusable house library's blocking delivery.
@evidence obligations/core/common.md#layer-boundary This unit owns finish construction and material response inputs, while model geometry, space topology, fit-out placement, and lighting remain with their named owners.
@evidence obligations/core/common.md#production-language The owner keeps the readable finish descriptions alongside exact stable MaterialId and surface-owner tokens used by source.
@evidence obligations/core/common.md#proportionate-development The envelope population covers the house's visible exterior families and measured repeated modules without inventing hidden construction or photoreal fabrication.
@evidence obligations/design/materials.md#addressable-material-decisions The four elevations, three roof owners, openings, porch, chimney, and garage each receive a concrete material decision with a stable source address.
@evidence obligations/design/materials.md#material-identity-assembly The siding, brick, roof, trim, glazing, door, porch, chimney, and garage assignments specify the visible assembly and junction order.
@evidence obligations/design/materials.md#material-surface-assignment The finish bindings attach to the complete elevation and roof owners and do not split or re-own the model surfaces.
@evidence obligations/design/materials.md#material-response The renderer-facing values are documented separately from this envelope assignment, with calibrated optics and hidden physical construction left outside scope.
@evidence settings/house.md#delivery-scope The envelope finishes serve the one reusable two-storey house with one attached empty garage and add no vehicle or second-building subject.
@evidence settings/house.md#governing-aim The material hierarchy prioritizes a readable ordinary home silhouette and surface distinction before decorative detail.
@evidence settings/house.md#scale-and-coordinate-convention All finish module dimensions and host ids use the authored metre frame and front-negative-Z orientation.
@evidence settings/house.md#visual-grammar The exterior palette realizes the declared siding, brick, roof, trim, window, door, porch, chimney, and garage distinctions.
@evidence settings/house.md#delivery-fidelity-and-review-condition The assembly is a blocking proxy for visible layer order and explicitly refuses certified wall, roof, membrane, and photoreal certainty.
@evidence settings/house.md#subject-breakdown-production-scope The assignment covers the exposed house elevations, attached garage, openings, porch, chimney, and roof subjects named by the production.
@evidence settings/house.md#operative-subjects-and-services Exterior finish bindings give the visible envelope and service-facing garage subjects stable material owners without claiming hidden services.
@evidence settings/house.md#reference-basis-and-uncertainty The palette and ordering follow the five visual references as qualitative guidance, while dimensions remain authored or source-derived rather than pixel-inferred.
@evidence upstream/design/materials.md#parent-revision-from-material-work This unit tested the model and space surface identities, coordinates, and host roles against every envelope assignment and found no parent defect requiring repair.
-->

The exterior material population binds to the model's complete elevation owners `surface.elevation.front`, `surface.elevation.back`, `surface.elevation.left`, and `surface.elevation.right`, and to `surface.roof.main.north`, `surface.roof.main.south`, and `surface.roof.garage`. It does not redefine their wall, opening, or roof geometry. Exterior wall parts receive `siding-white`, interior partition parts are rematerialized as `paint-warm-white`, the measured facade modules receive `siding-white` above a 0.75 m brick skirt, and roof parts receive `roof-charcoal` over the roof slabs.

Door frames use `trim-white`, window and slider frames use `metal-black`, doors use `door-walnut`, glazing uses `glass-smoke`, and garage-door panels and frames use `metal-black`. Roof ridge caps also use `trim-white`. The front porch uses `concrete-cool-gray` with `trim-white` columns. `chimney/front-left` and brick skirt modules use `brick-red-brown`; the attached garage repeats siding and trim but remains visually subordinate to the main gabled mass. The assembly is a blocking proxy for visible layer order, not a certified wall, roof, air-gap, or membrane specification.

## Interior finish map {#interior-finish-map}

<!--
@evidence principles/core/common.md#declared-basis This unit assigns one authored floor finish to each of the 15 room surface owners and records the wall, ceiling, cabinet, counter, and backsplash finish roles.
@evidence principles/core/common.md#scope-preservation The room finish map preserves the space graph's room boundaries and the model's surface receivers instead of creating new rooms or moving partitions.
@evidence principles/core/common.md#substantive-completion The fifteen room assignments and the interior wall, ceiling, kitchen, and fit-out material vocabulary are stated as source-backed results.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This H2 specializes the space room-surface map and model receiver ids into floor and interior finish bindings without duplicating topology or fit-out placement.
@evidence principles/design/materials.md#material-construction-appearance The oak, carpet, tile, concrete, painted-wall, cabinet, counter, and backsplash roles distinguish construction and finish families at the room owners.
@evidence principles/design/materials.md#material-binding-interface Floor finish elements carry the room-assigned MaterialId, while wall, ceiling, cabinet, counter, and backsplash parts retain their source material bindings.
@evidence principles/design/materials.md#material-verification-address Each room id, floor-finish element id, space surface owner, and material token gives the assignment a direct verification address.
@evidence obligations/core/common.md#purpose-fit The room finish assignments make the complete house interior readable at blocking distance without adding unsupported construction detail.
@evidence obligations/core/common.md#layer-boundary Spaces own room boundaries and floor intent, models own receiver geometry, materials own finish assignment and response, and instances and systems retain their downstream roles.
@evidence obligations/core/common.md#production-language The owner keeps human-readable room descriptions beside the exact `floor-finish/<space>` and MaterialId source identities.
@evidence obligations/core/common.md#proportionate-development The material map resolves all 15 rooms and the main interior finish families without pretending to specify hidden membranes or calibrated optics.
@evidence obligations/design/materials.md#addressable-material-decisions Every room floor and each stated interior finish family has an explicit stable source owner.
@evidence obligations/design/materials.md#material-identity-assembly The finish vocabulary identifies oak, carpet, tile, concrete, paint, cabinet, stone, backsplash, and fit-out material identities used by source.
@evidence obligations/design/materials.md#material-surface-assignment The floor realization creates one finish element per room and preserves the parent room surface ownership rather than applying one global slab.
@evidence obligations/design/materials.md#material-response The source vocabulary and deterministic lowering provide readable blocking distinctions while calibrated reflectance and transmission remain unverified.
@evidence settings/house.md#visual-grammar The room map realizes the settings' oak, carpet, tile, concrete, painted-wall, cabinet, stone, and warm family-home distinctions.
@evidence settings/house.md#operative-subjects-and-services The kitchen, bath, laundry, garage, and room surfaces receive the visible material roles required by the operative interior subjects.
@evidence settings/house.md#scale-and-coordinate-convention Room floor elements and upper-floor assignments use the shared metre frame and authored upper elevation.
@evidence settings/house.md#delivery-fidelity-and-review-condition The map promises readable blocking distinctions and leaves photoreal optical response, hidden services, and certified assemblies unverified.
@evidence spaces/house.md#building-and-storeys The fifteen floor owners remain contained by the two authored storeys and do not alter the single stair or building graph.
@evidence spaces/house.md#ground-floor-public-and-common-graph The entry, living, stair-hall, and continuous kitchen-dining-family room retain their separate floor finish owners inside the fixed public graph.
@evidence spaces/house.md#ground-floor-service-and-garage-graph Pantry, powder, laundry-mudroom, and garage floor assignments follow the service-band and attached-garage room owners.
@evidence spaces/house.md#upper-floor-private-graph The upper hall, bedrooms, bathrooms, and linen-storage floors retain the private graph's room identities and carpet/tile assignments.
@evidence spaces/house.md#room-surface-ownership The floor-finish elements consume each Space.floorMaterial and bind to the corresponding room surface owner exactly once.
@evidence spaces/house.md#spatial-review-population The complete room finish population remains available to the threshold, corner, and cardinal room observations.
@evidence upstream/design/materials.md#parent-revision-from-material-work The room finish assignment tested every space floor owner and its model receiver for a stable material binding and found no parent boundary defect.
-->

The 15 room surface owners receive one floor finish from the `Space.floorMaterial` assignment: `wood-oak` for `ground/front-entry`, `ground/living-room`, `ground/stair-hall`, `ground/kitchen-dining-family`, and `ground/pantry`; `tile-pale` for `ground/powder-room`, `ground/laundry-mudroom`, `upper/bathroom-one`, and `upper/primary-bath`; `concrete-cool-gray` for `ground/garage`; and `carpet-warm-gray` for `upper/hall`, `upper/primary-bedroom`, `upper/bedroom-two`, `upper/bedroom-three`, and `upper/linen-storage`. The floor realization creates exactly one finish element per room from that owner-side value, rather than applying one global floor material.

The oak floor direction is consistent across the principal ground-floor rooms. Bedrooms and the upper corridor read as low-pile warm-gray carpet. Interior partitions and ceilings use `paint-warm-white`; exterior wall parts retain `siding-white`; kitchen cabinets use `cabinet-taupe`, counters use `stone-pale`, and the backsplash uses the pale-tile family represented by `tile-pale`. Furniture and fixture materials such as `wood-walnut`, `fabric-oatmeal`, `fabric-blue-gray`, and `greenery` are available to the fit-out population but do not change room surface ownership.

## Repeated module laws {#repeated-module-laws}

<!--
@evidence principles/core/common.md#declared-basis This unit declares the 13 repeated material laws, their host owners, measured spans, family pitches, counts, and stagger metadata.
@evidence principles/core/common.md#scope-preservation The law producer keeps host geometry with the model and derives only the repeated finish modules, including the explicit garage segment cases.
@evidence principles/core/common.md#substantive-completion The source emits every declared law from measured inputs and the materials review has an addressable count and footprint for each law.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This H2 turns the model's stable elevation and roof hosts into measured siding, brick, and shingle repetition without changing their envelope.
@evidence principles/design/materials.md#material-construction-appearance The laws encode course pitch, module footprint, skirt elevation, corner/half-module metadata, and transformed roof placement as visible finish construction.
@evidence principles/design/materials.md#material-binding-interface Every generated module Part carries the family MaterialId and stable law/row/column id through the existing element boundary.
@evidence principles/design/materials.md#material-verification-address Law ids, emitted part ids, measured spans, host surface owners, and the neutral exterior/roof observations make repetition falsifiable.
@evidence obligations/core/common.md#purpose-fit The measured laws provide the repeated siding, brick, and roof distinctions needed for the house's blocking exterior without a hand-authored mesh registry.
@evidence obligations/core/common.md#layer-boundary The module generator owns repeated finish construction, while model roof/wall geometry and spaces' topology remain upstream owners.
@evidence obligations/core/common.md#production-language The law ids and family names remain readable alongside exact source coordinates and MaterialId tokens.
@evidence obligations/core/common.md#proportionate-development The 13-law population covers facade and roof repetition at the requested house scale without adding unsupported manufacturer detail.
@evidence obligations/design/materials.md#addressable-material-decisions Each law has one stable id, host owner, measured span, pitch, count, and emitted module population.
@evidence obligations/design/materials.md#material-identity-assembly The producer applies distinct siding, brick, and shingle identities with explicit skirt, garage, roof, and corner-return rules.
@evidence obligations/design/materials.md#material-surface-assignment The generated modules stay inside their declared host footprint and do not take ownership of wall or roof boundaries.
@evidence obligations/design/materials.md#material-response The repeated population is authored for readable blocking scale; microtexture, weathering, and calibrated optical response remain outside the law.
@evidence settings/house.md#visual-grammar The laws realize the settings' white siding, brick skirt, charcoal roof, garage subordination, and ordinary suburban material rhythm.
@evidence settings/house.md#scale-and-coordinate-convention All count and footprint inputs are metre values in the shared main-house and garage coordinate frame.
@evidence settings/house.md#reference-basis-and-uncertainty The measured law spans are authored source values informed qualitatively by references rather than reverse-engineered from pixels.
@evidence spaces/house.md#building-and-storeys The laws attach to the two-storey building's exposed elevations and roof hosts without changing storey containment.
@evidence spaces/house.md#ground-floor-service-and-garage-graph The right-garage laws use the attached garage Z span and garage plane rather than collapsing the service/garage boundary into the main facade.
@evidence spaces/house.md#spatial-review-population The exterior and roof law population is included in the compiled observation set used to inspect facade and roof repetition.
@evidence upstream/design/materials.md#parent-revision-from-material-work The 13 laws tested every host span, transformed roof basis, garage segment, and module boundary; no parent geometry repair was required.
-->

Repeated finish geometry is generated by the 13 stable module laws in `src/house.ts`, with count derived from measured length, measured height, family spacing, and the family-specific row/module pitch. The siding laws use `0.203 m` board-course spacing and `0.812 m` nominal module length, and record `corner-return` as their stagger rule: front `16.8 x 4.58 m`, back `11.0 x 4.58 m`, left `9.6 x 4.58 m`, right-main `9.6 x 4.58 m`, and right-garage `5.95 x 1.75 m`. Their IDs are `module.siding.front`, `module.siding.back`, `module.siding.left`, `module.siding.right-main`, and `module.siding.right-garage`.

The brick laws use `0.1875 m` course height, `0.406 m` nominal bed length, and alternating half-module offsets around the same five facade lengths at `0.75 m` skirt height; their law records `alternate-half-module` rather than a separate corner-return operation. Their IDs are `module.brick.front-skirt`, `module.brick.back-skirt`, `module.brick.left-skirt`, `module.brick.right-main-skirt`, and `module.brick.right-garage-skirt`. The main roof laws use `0.305 m` course and module pitch over `10.15 x 6.25 m` slope extents; the garage law uses the same pitch over `6.55 x 5.95 m`. These IDs are `module.shingle.main-north`, `module.shingle.main-south`, and `module.shingle.garage`.

The module producer derives both row and column capacity from each law's measured host span and transformed module footprint, applies its row offset, starts brick rows at `y=0.15 m` and siding rows at `y=0.90 m` above the `0.75 m` skirt, and places centres directly inside the resulting safe interval without terminal overlap-repair clamping. Facade rows use the `.92` course-height footprint, facade columns use the `.95` module-length footprint with the maximum half-spacing stagger, and roof rows use a transformed step no smaller than either the pitched module footprint or its transformed nominal pitch while roof columns use the transformed host Z span. `module.siding.right-garage` and `module.brick.right-garage-skirt` are explicit garage-segment cases, including the latter's `-skirt` suffix; their side modules use the garage Z span and the garage plane `x=11.4 m`, not the main right plane at `x=5.6 m`. The law retains the declared stagger rule as source metadata, while the current producer's visible placement operation is the measured row/column offset. The resulting population is measured and regenerated, not a hand-copied set of face records. A count, host surface, or span that cannot be derived from these law inputs remains unverified.

## Binding and renderer response {#binding-and-renderer-response}

<!--
@evidence principles/core/common.md#declared-basis This unit declares the MaterialId binding vocabulary and the deterministic renderer-facing response record used by the compiled material models.
@evidence principles/core/common.md#scope-preservation The response table does not reassign surfaces or geometry and keeps unsupported photometric and engineering behavior outside the authored claim.
@evidence principles/core/common.md#substantive-completion The source materialFor lowering and MATERIAL_COLORS response fields provide a concrete deterministic result for every declared MaterialId.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This H2 carries model and space material tokens into runtime-facing blocking parameters without becoming a second model or room owner.
@evidence principles/design/materials.md#material-construction-appearance The response is separated from construction assignment so colours, metallic, roughness, opacity, and texture limits cannot be mistaken for wall or roof assembly.
@evidence principles/design/materials.md#material-binding-interface The source lowers each MaterialId through `materialFor` and `modelFor` into the installed environment material/model boundary.
@evidence principles/design/materials.md#material-verification-address The MaterialId vocabulary and deterministic parameter fields give each response a stable source and renderer inspection address.
@evidence obligations/core/common.md#purpose-fit The blocking renderer response preserves the material distinctions needed to inspect the house library without claiming production-ready optics.
@evidence obligations/core/common.md#layer-boundary This unit owns material response inputs, while model geometry, room topology, fit-out population, and lighting process remain outside it.
@evidence obligations/core/common.md#production-language The response owner retains exact MaterialId tokens and readable descriptions for the same deterministic records.
@evidence obligations/core/common.md#proportionate-development The response specifies only the finite blocking fields the current source emits and leaves unsupported channels explicitly unverified.
@evidence obligations/design/materials.md#addressable-material-decisions Every material response is keyed by one declared MaterialId and the source lowering path.
@evidence obligations/design/materials.md#material-identity-assembly The response preserves the distinct identities of paint, siding, brick, roof, trim, glass, wood, carpet, tile, concrete, cabinet, stone, fabric, and greenery.
@evidence obligations/design/materials.md#material-response The deterministic base colour, metallic, roughness, opacity, alpha, emission, and texture settings are stated with their blocking limits.
@evidence settings/house.md#visual-grammar The response preserves the warm-white, oak, carpet, tile, concrete, charcoal, brick, and metal distinctions named by the settings.
@evidence settings/house.md#delivery-fidelity-and-review-condition The renderer response is a readable blocking proxy, not a claim of calibrated optical, photometric, or photoreal output.
@evidence settings/house.md#operative-subjects-and-services The material lowering supports the visible envelope, room, fixture, kitchen, garage, and service subjects while hidden services remain unverified.
@evidence spaces/house.md#room-surface-ownership Room floor MaterialIds remain the space-owned assignments consumed by the material lowering.
@evidence upstream/design/materials.md#parent-revision-from-material-work The response fields were checked against the source MaterialId vocabulary and parent receiver bindings without exposing a parent repair.
-->

The binding token is the `MaterialId` carried by each model `Part`; the consuming environment lowers it to `material/<MaterialId>` models without transferring geometry ownership. The current material vocabulary is `paint-warm-white`, `siding-white`, `brick-red-brown`, `roof-charcoal`, `trim-white`, `glass-smoke`, `door-walnut`, `metal-black`, `wood-oak`, `wood-walnut`, `carpet-warm-gray`, `tile-pale`, `concrete-cool-gray`, `cabinet-taupe`, `stone-pale`, `fabric-oatmeal`, `fabric-blue-gray`, and `greenery`.

The deterministic renderer-facing response uses the authored base colours in `MATERIAL_COLORS`, `opacity: 1`, `alphaMode: "opaque"`, `doubleSided: true`, `emissive: null`, and `baseColorTexture: null` for every material. `metal-black` alone uses `metallic: 0.72`; all other materials use `metallic: 0`. `glass-smoke` uses `roughness: 0.18`; all other materials use `roughness: 0.7`. These values provide readable blocking distinctions and are not claims of calibrated optical or physical measurements.

## Finish limit {#finish-limit}

<!--
@evidence principles/core/common.md#declared-basis This unit declares the boundary between readable blocking material distinction and unsupported certified construction, calibrated optics, and photoreal finish.
@evidence principles/core/common.md#scope-preservation The explicit unverified list prevents hidden membranes, weathering, transmission, UV, and manufacturer detail from being silently claimed by the material layer.
@evidence principles/core/common.md#substantive-completion The finish limit names both the delivered material questions and the exact response and construction questions that remain outside the source.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This H2 converts the settings review ceiling and parent model/space boundaries into material-specific refusal conditions.
@evidence principles/design/materials.md#material-construction-appearance The limit distinguishes visible layer, grain, trim, and repetition from fabrication and microtexture that this source does not encode.
@evidence principles/design/materials.md#material-binding-interface The refusal boundary preserves the existing MaterialId and lowering interface without inventing additional runtime channels.
@evidence principles/design/materials.md#material-verification-address Each unsupported claim is tied to a missing measurement or authored source capability rather than hidden behind a generic completion statement.
@evidence obligations/core/common.md#purpose-fit The limit keeps the material delivery honest for a deterministic blocking library instead of expanding it into an architectural or photoreal specification.
@evidence obligations/core/common.md#layer-boundary The material owner refuses hidden structural, engineering, lighting, and service claims that belong to other or unsupported owners.
@evidence obligations/core/common.md#production-language The limit records readable material terms together with explicit `unverified` boundaries rather than replacing them with invented technical values.
@evidence obligations/core/common.md#proportionate-development The refusal list is proportional to the blocking house scope and does not add a second fabrication system.
@evidence obligations/design/materials.md#addressable-material-decisions The promised material distinctions and each unsupported response boundary are named at the material H2 owners.
@evidence obligations/design/materials.md#material-response The source states exactly which optical and physical response fields are deterministic and which remain unverified.
@evidence obligations/design/materials.md#material-review-set The neutral review set supplies the conditions for future appearance checks without treating an unobserved render as complete.
@evidence settings/house.md#delivery-fidelity-and-review-condition The finish limit follows the settings' blocking-pass ceiling and preserves the distinction between readable output and photoreal or survey certainty.
@evidence settings/house.md#reference-basis-and-uncertainty The limit does not convert qualitative reference mood or material appearance into unverified dimensional or optical facts.
@evidence spaces/house.md#spatial-review-population The room and exterior observation population remains the address for future material readability checks.
@evidence upstream/design/materials.md#parent-revision-from-material-work The finish limit records that parent surfaces and source interfaces were examined and no unsupported parent repair was hidden in the material refusal list.
-->

The model promises material distinction, grain direction, trim hierarchy, measured repeated modules, and readable surface repetition at the settings review distance. Fine manufacturer marks, physically certified assemblies, hidden membranes, exact product provenance, calibrated reflectance, UV authoring, transmission, weathering, and photoreal microtexture are unverified and outside this blocking-to-fit-out delivery. A surface or response that cannot be measured or inspected remains explicitly unverified rather than receiving an invented value.

## Neutral material review set {#neutral-material-review-set}

<!--
@evidence principles/core/common.md#declared-basis This unit declares the neutral daytime material observation set, exposed surfaces, room cardinal observations, comparison distance, and material-specific questions.
@evidence principles/core/common.md#scope-preservation The review set retains every exposed elevation, roof, opening, and room population and does not replace the complete set with a preferred hero view.
@evidence principles/core/common.md#substantive-completion The set names the source-derived observation population, material samples, comparison questions, and explicit GPU/observer limits.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This H2 turns the settings inspection condition and model/space observation populations into material-specific falsification questions.
@evidence principles/design/materials.md#material-construction-appearance The samples test visible layer order, course rhythm, grain, trim hierarchy, and room finish distinction under one neutral comparison condition.
@evidence principles/design/materials.md#material-binding-interface The review checks each declared MaterialId against its stable surface or fit-out owner and the renderer-facing lowering.
@evidence principles/design/materials.md#material-verification-address The 181 compiled observation ids, four elevations, roof subjects, openings, and room cardinal views are the concrete review addresses.
@evidence obligations/core/common.md#purpose-fit The review set tests the material questions needed to judge the delivered blocking library without claiming an unobserved photoreal result.
@evidence obligations/core/common.md#layer-boundary The set reviews material response and assignment while leaving geometry, topology, fit-out identity, hidden services, and renderer/GPU certification with their proper boundaries.
@evidence obligations/core/common.md#production-language The observation questions use the readable material vocabulary and exact source ids needed to reproduce a finding.
@evidence obligations/core/common.md#proportionate-development The population covers all rooms, openings, exposed sides, roof slopes, and material families at the scale of this house without unnecessary capture variants.
@evidence obligations/design/materials.md#addressable-material-decisions Every declared material owner and repeated law appears in a named review question or sample family.
@evidence obligations/design/materials.md#material-review-set The review set states neutral lighting, inspection distance, exposed surfaces, room cardinal observations, and comparison criteria.
@evidence obligations/design/materials.md#material-response The comparison asks whether the deterministic response preserves colour, metallic, roughness, opacity, texture, and material distinctions, while GPU appearance remains unverified until observed.
@evidence settings/house.md#delivery-fidelity-and-review-condition The set follows the settings' neutral inspection condition and complete-house observation requirement rather than a hero frame.
@evidence settings/house.md#reference-basis-and-uncertainty The review compares authored source results with qualitative reference relationships and does not use reference pixels as measurements.
@evidence spaces/house.md#spatial-review-population The review consumes the 181 setting, exterior, opening, threshold, corner, and room-cardinal observation addresses.
@evidence spaces/house.md#room-surface-ownership Room cardinal and threshold observations test each room's floor and surface-owner material assignment.
@evidence spaces/house.md#openings-and-route-schedule The neutral material set includes every opening observation so door, glazing, and trim bindings are checked at the opening hosts named by the space route schedule.
@evidence upstream/design/materials.md#parent-revision-from-material-work The review plan tested the parent surface and room-owner population needed for finish verification without changing parent geometry.
-->

Material review uses the compiled model observation population with neutral daytime lighting, a consistent inspection distance, and the four exposed elevations, both main roof slopes, the garage roof, every opening, and the room cardinal observations. Exterior samples test siding courses, brick skirt rhythm and corner returns, roof shingle span, trim hierarchy, porch concrete, and garage subordination. Interior samples test each of the 15 room floor assignments, oak direction, carpet/tile/concrete separation, wall and ceiling paint, kitchen cabinet/counter contrast, and fixture or furniture material readability.

The review comparison asks whether each declared MaterialId is bound to the intended stable surface or fit-out owner, whether module repetition remains inside its host and keeps its declared spacing, and whether the renderer-facing response preserves the intended warm-gray, oak, tile, concrete, charcoal, brick, and metal distinctions. GPU-backed appearance, observer measurement, hidden services, certified construction, and photoreal finish remain unverified until independently observed.
