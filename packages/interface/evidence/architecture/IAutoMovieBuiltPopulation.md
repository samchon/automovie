# src/architecture/IAutoMovieBuiltPopulation.ts#IAutoMovieBuiltPopulation

## @evidence contracts/development/design.md#principled-representation `builtInstanceSetPlacementBounds` derives world envelopes from the authored prototype box: occupied grid/lattice hull slots, the declared scatter disk or the first count explicit transforms. Fixed rotations transform corners; varying rotation ranges use an origin-centred enclosing sphere. Scatter/variation envelopes can exceed realized seeded members and ignore visibility thinning; binary64 arithmetic is not outward rounded and does not certify an enclosure of arbitrary rendered geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, the owning space, the local prototype box, and the set, are exactly what a building query cannot obtain elsewhere; lowering hands the same set object to the production world instead of copying or expanding it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Space containment and prototype completeness remain author obligations, not measured claims. Building validation checks the placement subset, including safe counts, finite ordered prototype/variation data and all stored explicit transforms, while production owns the full instance-set design contract. `along-route` is refused because no production route registry is available; no population is expanded to make its bounds appear exact.

## @evidence contracts/development/common.md#meaningful-documentation

States which space to name and what validation checks of it, the model-local frame and metre units of the prototype box, that the author must refresh it when a prototype changes, which boxes are valid, and which layout is refused and why.
