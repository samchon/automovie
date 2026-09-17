<!--
@evidence discovery/core/common.md#canonical-realization Each complete visual surface is assigned to one canonical owner rather than being distributed by implementation convenience.
@evidenceReview discovery/core/common.md#canonical-realization #5a6e541 Compared docs/contracts/surface-ownership.md#docs/contracts/surface-ownership.md with target discovery/core/common.md#canonical-realization and independently confirmed canonical-realization through this host's authored decision: Each complete visual surface is assigned to one canonical owner rather than being distributed by implementation convenience.
@evidence discovery/design/materials.md#work-specific-material-requirements Surface construction and renderer response for the named host schedule are assigned to the materials design population.
@evidenceReview discovery/design/materials.md#work-specific-material-requirements #19a2072 Compared this surface-ownership contract with the material discovery predicate and confirmed that its named host schedule assigns construction and renderer response to the materials population while space/model owners retain boundaries and stable surfaces; an unassigned host schedule or geometry change in the material handoff would falsify this relationship.
-->
# Surface ownership

This target defines the production's stage-1/2 decomposition and the ownership boundary between a surface, its construction material, and repeated members.

## Every complete visual surface has one owner {#every-complete-visual-surface-has-one-owner}

At the close of the massing and space-graph stage, the production declares one owner for every complete exterior elevation, roof plane and underside, courtyard-facing arcade face, opening reveal and leaf, room boundary, room floor, ceiling/roof underside, and service-yard boundary. A surface is not split between multiple owners merely to shorten a file. The space owner names the host and boundary; the material owner names the construction and response bound to that host; the instance owner names only repeated members that sit on or cover the host. A module is authored from its measured dimensions, spacing, count, and edge rules, never by copying a record for every member.

Authority: the user's 2026-09-16 brief. Success is a complete surface schedule with no unowned or multiply owned surface and a repeat rule for every repeated member. Failure is a large catch-all file, a surface whose finish owner is ambiguous, or a repeated column, tile, roof unit, or vessel represented by manual record duplication.

Review question: does every visible surface and repeated member resolve to one semantic owner, one stable host, and one measurable realization rule?

Sources: user brief, 2026-09-16; [NASA systems engineering handbook on bidirectional traceability](https://www.nasa.gov/reference/systems-engineering-handbook/)
