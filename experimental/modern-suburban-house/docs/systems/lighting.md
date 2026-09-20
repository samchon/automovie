# House systems

## Daylight and electric lighting {#daylight-and-electric-lighting}

<!--
@evidence principles/core/common.md#declared-basis This unit names the one authored inspection state and the 16 visible fixture cues that make the lighting boundary concrete.
@evidence principles/core/common.md#scope-preservation The lighting population preserves space, opening, material, and fit-out ownership and does not create a second geometry or route owner.
@evidence principles/core/common.md#substantive-completion The unit states the visible lighting result and the photometric, shadow, exposure, and calibration claims it deliberately does not make.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This system unit specializes the reviewed house graph and material vocabulary into visible lighting cues without absorbing their ownership.
@evidence principles/design/systems.md#system-authority-confinement The fixture population writes only visible lighting cues and cites spaces, openings, and material bindings as consumed inputs.
@evidence principles/design/systems.md#system-dependency-basis The daylight context, compiled spaces, material vocabulary, and fixed fixture population are the named inputs for this static system.
@evidence principles/design/systems.md#system-verification-address The fixture ids, room bindings, material, and 181-observation review population provide falsifiable addresses for the visible system claims.
@evidence obligations/core/common.md#purpose-fit The 16 fixture cues serve the blocking library's required room and material readability without promising a finished render pipeline.
@evidence obligations/core/common.md#layer-boundary This H2 keeps lighting cues in systems while geometry, topology, material construction, and fit-out remain with their owners.
@evidence obligations/core/common.md#production-language The readable lighting account retains the exact `lighting/<space-id>/ceiling-fixture` and task-light identities used by source.
@evidence obligations/core/common.md#proportionate-development The static cue population is sufficient for the ordinary house scale and does not invent a larger illumination architecture.
@evidence obligations/design/systems.md#addressable-system-decisions The daylight inspection state and visible fixture population are the independently addressable lighting decisions.
@evidence obligations/design/systems.md#system-ownership-interfaces The unit names its space, opening, material, source, and viewer interfaces and the state channels it does not write.
@evidence obligations/design/systems.md#system-budget-degradation The fixed 16-element boundary and explicit no-photometric fallback define the system's resource and degradation result.
@evidence settings/house.md#delivery-scope The system stays inside the one reusable two-storey house and attached empty garage delivery.
@evidence settings/house.md#governing-aim The visible fixture cues serve the inspection-distance reading of one plausible ordinary home.
@evidence settings/house.md#delivery-fidelity-and-review-condition The lighting promise is bounded by the deterministic blocking-to-fit-out review condition rather than photoreal illumination.
@evidence settings/house.md#visual-grammar The warm fixture cues support the settings palette and the readable oak, trim, roof, and tile distinctions.
@evidence settings/house.md#operative-subjects-and-services Lighting fixtures are an operative visible population while hidden electrical and building-service networks remain unverified.
@evidence settings/house.md#subject-breakdown-production-scope The visible lighting population belongs to the settings-listed house, room, opening, fixture, and service subject breakdown.
@evidence settings/house.md#reference-basis-and-uncertainty The five references inform the qualitative daylight and warm-fixture relationship without supplying photometric or dimensional evidence.
@evidence maps/site.md#site-boundary-and-orientation The system remains subordinate to the one-lot orientation and attached-building site boundary.
@evidence maps/site.md#building-placement-and-access The lighting population follows the placed main house, porch, garage, and access interfaces.
@evidence maps/site.md#site-review-consequence The exterior and overhead site observations remain part of the neutral context for the lighting review.
@evidence spaces/house.md#building-and-storeys The fixture population remains contained by the two-storey building and its 15 named spaces.
@evidence spaces/house.md#ground-floor-public-and-common-graph The lighting cues preserve the continuous ground-floor public/common graph.
@evidence spaces/house.md#upper-floor-private-graph The room-owned fixtures preserve the upper private graph and its short hall relation.
@evidence spaces/house.md#openings-and-route-schedule Front and rear openings are consumed as daylight context without changing the route schedule.
@evidence spaces/house.md#spatial-review-population The 181 compiled observations address the visible lighting boundary's rooms, openings, elevations, corners, roofs, and thresholds.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work The current lighting pass examined the 15 room bindings, front/rear opening context, trim-white material interface, fixed 16-element budget, unsupported hidden services, and neutral observation condition and found them sufficient without repairing a parent.
-->

The system owns one static `day-neutral-inspection` state for this library. Front and rear openings are the authored daylight inspection context, while the visible warm ceiling fixtures and kitchen under-cabinet task light are fixture cues that keep room boundaries and the warm oak, white trim, charcoal roof, and tile distinctions readable. Photometric daylight, lamp energy, shadows, exposure, and colour calibration are not emitted by this source and remain `unverified`.

The deterministic source realization is the `lightingElements` population in `src/house.ts`: it emits one room-owned element `lighting/<space-id>/ceiling-fixture` for each of the 15 compiled spaces and one `lighting/kitchen/under-cabinet-task-light` element for the kitchen. The fixture elements consume the space population's bounds and the material owner's `trim-white` binding; they do not rewrite room boundaries, openings, or fit-out placement.

## Ownership and interfaces {#ownership-and-interfaces}

<!--
@evidence principles/core/common.md#declared-basis This unit declares the consumed spaces, openings, material vocabulary, source owner, lowering owner, and viewer boundary as its interface basis.
@evidence principles/core/common.md#scope-preservation The interface map prevents lighting from re-owning room topology, surface ownership, connector routes, or fit-out identities.
@evidence principles/core/common.md#substantive-completion Each input and write boundary is named for the ceiling and task fixture populations.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This interface unit specializes the reviewed spaces, openings, and material inputs into a system-owned fixture boundary.
@evidence principles/design/systems.md#system-authority-confinement The source owns fixture identity, room binding, centre, size, and tags while the space source owns primitive lowering and the viewer owns presentation.
@evidence principles/design/systems.md#system-dependency-basis The 15 spaces, front/rear openings, and fixture material vocabulary are explicit dependencies with no hidden global input.
@evidence principles/design/systems.md#system-verification-address Fixture ids and their space/material bindings expose the interface result to structural review.
@evidence obligations/core/common.md#layer-boundary This unit separates systems interfaces from the model, space, material, instance, and viewer owners.
@evidence obligations/core/common.md#production-language Exact source function, element id, space id, and material id are retained beside the human-readable interface description.
@evidence obligations/design/systems.md#system-ownership-interfaces The input, output, affected owners, authority, and presentation boundary are explicit.
@evidence obligations/design/systems.md#addressable-system-decisions The daylight context, ceiling fixtures, and task fixture are independently named decisions.
@evidence settings/house.md#operative-subjects-and-services Visible lighting is assigned to an operative source owner while hidden wiring and service networks remain outside scope.
@evidence spaces/house.md#room-surface-ownership Fixture elements reference rooms without taking ownership of their surfaces.
@evidence spaces/house.md#openings-and-route-schedule Opening context is read as daylight input and cannot create an additional passage or threshold.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work The interface audit compared all named system inputs and affected owners and found no missing authority or competing writer requiring an upstream repair.
-->

The lighting design depends on the 15 space ids and bounds from `modernSuburbanHouse.building.spaces` and uses the front and rear opening population from `modernSuburbanHouse.building.openings` as daylight inspection context; the current `lightingElements(spaces)` source function consumes spaces and the fixture material vocabulary only. `src/house.ts` owns fixture identity, room binding, center, size, and tags; `src/spaces/modern-suburban-house.ts` owns deterministic primitive-material lowering; the viewer owns only presentation. No lighting layer writes model geometry, surface ownership, room topology, connector routes, or instance identities.

The under-cabinet task light is intentionally bound to `ground/kitchen-dining-family`; ceiling fixtures are bound to their own room ids. A missing space, material id, or room binding is a source/interface failure, while absence of photometric output is an explicit capability boundary rather than an implicit fallback.

## State, clock, and determinism {#state-clock-and-determinism}

<!--
@evidence principles/core/common.md#declared-basis This unit defines the sole authored state label and the deterministic fixture fields that form its basis.
@evidence principles/core/common.md#scope-preservation The state account refuses to turn a renderer environment or hidden clock into authored house state.
@evidence principles/core/common.md#substantive-completion The unit explicitly resolves clock, seed, history, seek, and update-order questions for the static population.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This deterministic state unit specializes the inherited room and material inputs without creating a runtime state owner.
@evidence principles/design/systems.md#system-authority-confinement The state description keeps renderer environment choices outside the authored lighting write boundary.
@evidence principles/design/systems.md#system-dependency-basis The compiled spaces and material vocabulary are the complete named inputs for deterministic fixture derivation.
@evidence principles/design/systems.md#system-verification-address The 16 literal fixture ids, centres, sizes, tags, and bindings are the falsifiable state address.
@evidence obligations/core/common.md#layer-boundary Runtime renderer choices remain downstream and do not become a second authored lighting owner.
@evidence obligations/design/systems.md#system-state-clock The state, clock, seed, sampling, history, seek, and terminal-state boundary is explicitly static and history-free.
@evidence obligations/design/systems.md#system-ownership-interfaces The system state reads compiled spaces and material vocabulary without writing their identities.
@evidence settings/house.md#delivery-fidelity-and-review-condition The deterministic blocking representation, not calibrated illumination, is the delivered state condition.
@evidence settings/house.md#scale-and-coordinate-convention Fixture centres and sizes remain in the authored metre frame through space-derived placement.
@evidence spaces/house.md#spatial-review-population The neutral room, threshold, cardinal, elevation, corner, roof, and opening observations provide the static review address.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work The deterministic state audit exercised identical input spaces, material bindings, literal fixture identities, and absent runtime history and found no parent clock or dependency defect.
-->

The only authored lighting state is the design-side inspection label `day-neutral-inspection`; it is not a runtime photometric state object emitted by this source. It has no time clock, animation phase, random seed, accumulated history, seek state, or update order. Given the same compiled spaces and material vocabulary, the 16 fixture elements have the same IDs, centers, sizes, tags, and bindings. A consuming renderer may choose a daytime environment, but that runtime choice is outside this production source and is not presented as a deterministic authored illumination result.

## Budget and degradation {#budget-and-degradation}

<!--
@evidence principles/core/common.md#declared-basis This unit declares the fixed visible fixture count, absence of dynamic light work, and explicit unsupported-service boundary.
@evidence principles/core/common.md#scope-preservation The budget limits representation cost without removing required rooms, fit-out, or envelope subjects.
@evidence principles/core/common.md#substantive-completion The budget unit resolves the visible count, omitted dynamic work, degradation fallback, and unsupported engineering boundary.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This budget specializes the inherited house and fixture population into a bounded systems representation.
@evidence principles/design/systems.md#system-authority-confinement The degradation rule refuses to add substitute fixtures or claim renderer-owned illumination.
@evidence principles/design/systems.md#system-dependency-basis The fixed fixture count derives from the compiled 15 spaces and one kitchen task-light input, with no ambient budget state.
@evidence principles/design/systems.md#system-verification-address The 16-element count and explicit unsupported categories are measurable failure addresses.
@evidence obligations/core/common.md#proportionate-development The bounded fixture budget is proportionate to this reusable blocking library.
@evidence obligations/design/systems.md#system-budget-degradation The fixed count, absent dynamic/shadow/LOD tiers, and visible fallback are the complete budget and degradation result.
@evidence obligations/design/systems.md#system-ownership-interfaces The budget does not change the authority of the consumed space, material, or instance branches.
@evidence settings/house.md#delivery-fidelity-and-review-condition The budget supports the named inspection condition while refusing photoreal performance.
@evidence settings/house.md#operative-subjects-and-services Visible lighting fixtures are included; wiring, loads, emergency behavior, and service performance are outside scope.
@evidence spaces/house.md#building-and-storeys The fixed budget covers all 15 compiled spaces without adding a storey or hidden room.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work The fixed-count and degradation audit tested the visible 16-fixture budget, room coverage, fit-out interaction, and unsupported service limits and found them sufficient without an upstream repair.
-->

The fixed system budget is 16 visible fixture elements: 15 ceiling cues and one kitchen task cue. There is no dynamic-light population, shadow-map budget, exposure adaptation, light culling tier, or fixture LOD. If a consumer cannot provide illumination, the bounded fixture geometry and material cues remain available; the source does not invent substitute light energy or silently add fixtures. Hidden wiring, power loads, emergency behavior, and service performance are outside this blocking library.

## Services boundary {#services-boundary}

<!--
@evidence principles/core/common.md#declared-basis This unit identifies visible utility fixtures and the hidden-service categories that are explicitly outside the source boundary.
@evidence principles/core/common.md#scope-preservation The visible fixture population remains with instances and lighting while no decorative proxy claims to be plumbing, drainage, wiring, ductwork, or structure.
@evidence principles/core/common.md#substantive-completion The services unit names each visible service boundary and each hidden engineering category it refuses to represent.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit specializes the inherited room and instance service populations into a lighting boundary without re-owning them.
@evidence principles/design/systems.md#system-authority-confinement Lighting does not take ownership of kitchen, bathroom, laundry, garage, or hidden engineering objects.
@evidence principles/design/systems.md#system-dependency-basis Visible service fixtures, room bindings, and the explicit hidden-service omission are the complete named inputs and limits.
@evidence principles/design/systems.md#system-verification-address Room-bound visible fixtures and the explicit unverified categories give the service boundary a falsifiable address.
@evidence obligations/core/common.md#layer-boundary The systems account preserves instance ownership of visible utility fixtures and refuses unsupported hidden systems.
@evidence obligations/design/systems.md#system-ownership-interfaces The visible-service interface and the absent hidden-service interface are named separately.
@evidence settings/house.md#operative-subjects-and-services Visible service fixtures are operative subjects while hidden networks are classified as unverified.
@evidence settings/house.md#delivery-fidelity-and-review-condition The service boundary is part of the blocking delivery condition and does not claim hidden engineering performance.
@evidence spaces/house.md#ground-floor-service-and-garage-graph Visible utility fixtures remain within the service-band and attached-garage room graph.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work The service-boundary audit checked every visible utility category and each named hidden-service omission and found no parent decision requiring repair.
-->

Visible kitchen, bathroom, laundry, and garage utility fixtures are included and assigned to their rooms by the instance source; lighting does not take ownership of those objects. The source records no hidden pipe, duct, wiring, load calculation, drainage slope, or structural engineering network. Those unsupported system details remain `unverified` rather than being represented by decorative lines or invented performance claims.

## System review set and limits {#system-review-set-and-limits}

<!--
@evidence principles/core/common.md#declared-basis This unit declares the complete 181-observation denominator and the neutral visual questions for the lighting population.
@evidence principles/core/common.md#scope-preservation The review set keeps all exterior, opening, threshold, room, and fixture observations while leaving unsupported GPU and engineering questions unclaimed.
@evidence principles/core/common.md#substantive-completion The review set distinguishes structural fixture checks from the visual and engineering observations the source cannot support.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This review unit specializes the production observation denominator into lighting-specific structural and visual questions.
@evidence principles/design/systems.md#system-authority-confinement The review separates source fixture checks from renderer illumination and hidden-service ownership.
@evidence principles/design/systems.md#system-dependency-basis The review names the compiled observation population and structural predicates as its complete evaluation basis.
@evidence principles/design/systems.md#system-verification-address Every visible lighting claim points to fixture identity, room/material binding, host containment, fit-out interaction, or the named observation population.
@evidence obligations/core/common.md#purpose-fit The finite review set is sufficient for this blocking library's visible lighting boundary.
@evidence obligations/design/systems.md#system-review-set The 181 observations and structural predicates define the finite interface, failure, and observation cases for the system.
@evidence obligations/design/systems.md#system-ownership-interfaces The review keeps renderer, observer, and hidden-service judgments separate from source structural checks.
@evidence settings/house.md#delivery-fidelity-and-review-condition The neutral exterior, interior, and inspection-only conditions are inherited as the review frame.
@evidence settings/house.md#reference-basis-and-uncertainty Visual references remain qualitative context while falsification counts come from compiled source data.
@evidence spaces/house.md#spatial-review-population The 181 ids derive from the complete exterior, opening, threshold, corner, and cardinal room population.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work The review pass tested fixture count, ids, room/material bindings, host containment, fit-out interaction, and the 181-observation address and found no upstream defect; GPU illumination, shadow quality, lux, hidden services, and consumer environment remain unverified.
-->

The neutral system review set is the compiled 181-observation population: four exposed elevations, their corners, roof and underside observations, every opening and threshold, and the room cardinal observations. An author-side structural measurement of the current source-backed API found 15 ceiling fixtures and one kitchen task fixture, with zero duplicate ids, room-binding errors, material errors, host-containment errors, or positive-volume intersections with fit-out parts. Visual checks would ask whether the intended daylight-neutral reading preserves room identity and material separation. GPU-backed illumination, shadow quality, observer lux measurement, hidden services, and consumer-specific environment settings remain `unverified` until independently observed.
