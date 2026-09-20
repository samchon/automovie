<!--
@evidence discovery/core/common.md#shared-local-boundary This file retains the user's fixed spatial graph as a production-specific cross-layer rule.
@evidenceReview discovery/core/common.md#shared-local-boundary #ae499c0 The fixed-graph contract records the user's production-specific graph under docs/contracts and leaves shared principles in their shared owners; the falsifier would be a local rule silently replacing a shared owner.
@evidence discovery/core/settings.md#directive-promise-subject-requirements The brief fixes the building program, route, empty garage, and prohibited topology.
@evidenceReview discovery/core/settings.md#directive-promise-subject-requirements #1c99050 The fixed-graph contract preserves the brief's one house, attached garage, one stair, named rooms, and prohibited void/shortcut/vehicle subjects; the falsifier would be any required directive omitted or weakened in the graph.
@evidence discovery/design/spaces.md#work-specific-space-requirements The graph fixes rooms, openings, storeys, and circulation.
@evidenceReview discovery/design/spaces.md#work-specific-space-requirements #a751db6 The fixed-graph contract names the rooms, openings, storeys, and circulation edges that the space population must realize; the falsifier would be a required adjacency or opening missing from this contract.
@evidence discovery/design/maps.md#work-specific-map-requirements The graph fixes the single lot, attached garage placement, and front-to-rear orientation that the map realizes.
@evidenceReview discovery/design/maps.md#work-specific-map-requirements #7a5d44e The fixed-graph contract fixes one lot, attached garage placement, and front-to-rear orientation for the map owner; the falsifier would be a map that introduces a detached structure or reverses the declared interface.
@evidence discovery/design/models.md#work-specific-model-requirements The graph fixes the bounded building representation and fidelity ceiling that the model realizes.
@evidenceReview discovery/design/models.md#work-specific-model-requirements #e541d95 The fixed-graph contract was reviewed against the model target: its one-house, attached-garage, no-second-stair and no-hidden-service constraints are the authored predicates that the bounded model must preserve; the review would fail if the model introduced a second building, vehicle, void, or unsupported engineering claim.
@evidence discovery/design/instances.md#work-specific-instance-requirements The graph fixes repeated envelope populations and ordinary fit-out membership that instance realization must preserve.
@evidenceReview discovery/design/instances.md#work-specific-instance-requirements #95448eb The fixed-graph contract was reviewed against the instance target: its room schedule, attached empty garage, and repeated envelope/fit-out ownership constrain the 79-element/109-part population; the review would fail if instances changed the fixed graph or added vehicle proxies.
@evidence discovery/design/systems.md#work-specific-system-requirements The graph fixes the daytime lighting and visible-service boundary that systems realization must preserve.
@evidenceReview discovery/design/systems.md#work-specific-system-requirements #ff5015f The fixed-graph contract was reviewed against the systems target: its visible lighting and explicit hidden-service boundary constrain the 16-fixture source population; the review would fail if systems claimed hidden wiring, HVAC, plumbing, or a new room or connector.
-->
# Fixed spatial graph

This target records the production-specific spatial graph that all later owners must preserve.

## One house and one attached garage {#one-house-and-one-attached-garage}

The deliverable is one near-rectangular two-storey main house with only one right-attached two-car garage. The front entry connects directly to the living room and the central single L-turn stair. Kitchen, dining, and family room remain one continuous rear common space. The right service band contains pantry, powder room, and laundry/mudroom, with the mudroom directly connected to the garage. The upper floor has one short corridor from the stair landing to the primary bedroom, two small bedrooms, one shared bathroom, one primary bathroom, and storage. No second stair, void, hidden passage, disconnected room, or vehicle is permitted.

Authority: the user's 2026-09-16 brief. The approximately 246 m² area is a target range, not a survey result.

Review question: can the compiled topology trace every required room from the front entry through the one stair and named openings without inventing a route?

Sources: user brief, 2026-09-16; [buildingSMART IFC 4.3 space-boundary relationships](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcRelSpaceBoundary.htm)
