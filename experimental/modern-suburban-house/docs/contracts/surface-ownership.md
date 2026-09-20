<!--
@evidence discovery/core/common.md#canonical-realization Every retained visual rule has one semantic owner and one realization.
@evidenceReview discovery/core/common.md#canonical-realization #5a6e541 The surface-ownership contract gives complete elevations, roof families, storey planes, and room surfaces one semantic owner and gives generated repeats measured laws; the falsifier would be a split surface or a detail that changes the fixed graph.
@evidence discovery/design/materials.md#work-specific-material-requirements Surface construction and response require named material ownership.
@evidenceReview discovery/design/materials.md#work-specific-material-requirements #19a2072 The surface-ownership contract was reviewed against the materials target: complete elevations, roof families, storey planes, and room surfaces receive named material owners while repeated modules stay with measured laws; the review would fail if materials split a surface or changed the fixed graph.
@evidence discovery/design/instances.md#work-specific-instance-requirements Repeated siding, brick, shingle, and fit-out populations need stable instance ownership.
@evidenceReview discovery/design/instances.md#work-specific-instance-requirements #95448eb The surface-ownership contract was reviewed against the instances target: repeated facade and fit-out elements remain stable instance populations over their named hosts; the review would fail if an instance became an unowned second surface or moved a room boundary.
@evidence discovery/design/systems.md#work-specific-system-requirements Visible lighting fixtures and the explicit hidden-system boundary need a named systems owner.
@evidenceReview discovery/design/systems.md#work-specific-system-requirements #ff5015f The surface-ownership contract was reviewed against the systems target: visible fixture elements have a systems owner and hidden engineering remains unverified; the review would fail if lighting re-owned complete surfaces or invented hidden service geometry.
-->
# Surface ownership

This target records the production-specific ownership rule for complete visual surfaces and their generated modules.

## One complete visual surface has one owner {#one-complete-visual-surface-has-one-owner}

The production declares one owner for each exposed elevation, roof family, storey plane, and complete room surface. Openings and trim are elements of their host surface, not a second owner for a split surface. Repeated siding, brick, and shingles are generated from measured extents and repeat laws rather than copied records. A detail that would require changing the fixed graph is a stop for the coordinator.

Authority: the user's 2026-09-16 brief and `docs/spaces/house.md`.

Review question: does every complete visible elevation, roof family, storey plane, and room surface have one stable owner without a hidden split?

Sources: user brief, 2026-09-16; [NASA systems engineering handbook on requirements traceability](https://www.nasa.gov/reference/system-engineering-handbook/)
