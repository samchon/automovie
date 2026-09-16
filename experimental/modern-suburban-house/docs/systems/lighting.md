# House systems

## Daylight and electric lighting {#daylight-and-electric-lighting}

The system owns one static `day-neutral-inspection` state for this library. Front and rear openings are the authored daylight inspection context, while the visible warm ceiling fixtures and kitchen under-cabinet task light are fixture cues that keep room boundaries and the warm oak, white trim, charcoal roof, and tile distinctions readable. Photometric daylight, lamp energy, shadows, exposure, and colour calibration are not emitted by this source and remain `unverified`.

The deterministic source realization is the `lightingElements` population in `src/house.ts`: it emits one room-owned element `lighting/<space-id>/ceiling-fixture` for each of the 15 compiled spaces and one `lighting/kitchen/under-cabinet-task-light` element for the kitchen. The fixture elements consume the space population's bounds and the material owner's `trim-white` binding; they do not rewrite room boundaries, openings, or fit-out placement.

## Ownership and interfaces {#ownership-and-interfaces}

The lighting design depends on the 15 space ids and bounds from `modernSuburbanHouse.building.spaces` and uses the front and rear opening population from `modernSuburbanHouse.building.openings` as daylight inspection context; the current `lightingElements(spaces)` source function consumes spaces and the fixture material vocabulary only. `src/house.ts` owns fixture identity, room binding, center, size, and tags; `src/spaces/modern-suburban-house.ts` owns deterministic primitive-material lowering; the viewer owns only presentation. No lighting layer writes model geometry, surface ownership, room topology, connector routes, or instance identities.

The under-cabinet task light is intentionally bound to `ground/kitchen-dining-family`; ceiling fixtures are bound to their own room ids. A missing space, material id, or room binding is a source/interface failure, while absence of photometric output is an explicit capability boundary rather than an implicit fallback.

## State, clock, and determinism {#state-clock-and-determinism}

The only authored lighting state is `day-neutral-inspection`; it has no time clock, animation phase, random seed, accumulated history, seek state, or update order. Given the same compiled spaces and material vocabulary, the 16 fixture elements have the same IDs, centers, sizes, tags, and bindings. A consuming renderer may choose a daytime environment, but that runtime choice is outside this production source and is not presented as a deterministic authored illumination result.

## Budget and degradation {#budget-and-degradation}

The fixed system budget is 16 visible fixture elements: 15 ceiling cues and one kitchen task cue. There is no dynamic-light population, shadow-map budget, exposure adaptation, light culling tier, or fixture LOD. If a consumer cannot provide illumination, the bounded fixture geometry and material cues remain available; the source does not invent substitute light energy or silently add fixtures. Hidden wiring, power loads, emergency behavior, and service performance are outside this blocking library.

## Services boundary {#services-boundary}

Visible kitchen, bathroom, laundry, and garage utility fixtures are included and assigned to their rooms by the instance source; lighting does not take ownership of those objects. The source records no hidden pipe, duct, wiring, load calculation, drainage slope, or structural engineering network. Those unsupported system details remain `unverified` rather than being represented by decorative lines or invented performance claims.

## System review set and limits {#system-review-set-and-limits}

The neutral system review set is the compiled 181-observation population: four exposed elevations, their corners, roof and underside observations, every opening and threshold, and the room cardinal observations. Structural checks compare the 16 fixture ids, room bindings, material ids, and bounded transforms against the source; visual checks would ask whether the intended daylight-neutral reading preserves room identity and material separation. GPU-backed illumination, shadow quality, observer lux measurement, hidden services, and consumer-specific environment settings remain `unverified` until independently observed.
