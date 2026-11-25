# src/geometry/construction/AutoMovieSolidRailSolve.ts#AutoMovieSolidRailSolve.atlas

## @evidence contracts/development/implementation.md#principled-implementation

Solves the same plane and squared-chord equations on each actual face; a declared neighbour foot initializes another chart and must satisfy the actual equations before publication.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Face, chart and admitted jet move together through bounded Newton trials; a Newton step stays in its face's kept chart and changes face only by a recorded crossing, never straight back to the face the last crossing left.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No exterior surface, coordinate clamp, invented seam or tolerance change is used. Open adjacency, singular solves and exhausted budgets return null; original callback errors propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes an approximate starting chart from a solved retained rail, world-mm residuals from chart coordinates, and local convergence from global branch certification.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most steps iterations each use up to twenty backtracking trials, a trial past the kept boundary at most 52 bisections of its step share and, when it crosses, one Newton step of up to twenty halvings on the neighbour, and at most switches accepted face changes; atlas and surface callback costs remain part of this bound.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each admitted trial jet supplies both plane/chord residuals and the next accepted Jacobian; no scalar full-chord solve is repeated in each face.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All trial records and borrowed atlas references are call-local; the small returned chart/direction arrays belong to the caller, with no new cache.

# src/geometry/construction/AutoMovieSolidRailSolve.ts#AutoMovieSolidRailSolve.section

## @evidence contracts/development/implementation.md#principled-implementation

Newton solves (S-from).m=0 and |S-from|²=width² using exact total2 map derivatives and pre-evaluation owned-domain safeguarding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The caller provides the established step/rounding controls and receives only an admitted chart pair or null.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not clamp the point or certify global branch uniqueness; final accepted updates remain within the actually owned domain.

## @evidence contracts/development/common.md#meaningful-documentation

Width/from use mm, m is a nonzero section normal and bounds use the source chart units.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most steps jet/system evaluations and twenty scalar feasibility halvings per update, with constant temporary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same current jet supplies both residuals and both Jacobian rows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned chart scalars belong to the caller; no surface or iterate survives in a module cache.

# src/geometry/construction/AutoMovieSolidRailSolve.ts#AutoMovieSolidRailSolve.offset

## @evidence contracts/development/implementation.md#principled-implementation

Uses the unchanged scalar Newton chord/rate equation; null from the owned-domain reader rejects a nonexistent trial before geometric evaluation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The regional along callback owns chart coordinates and admission, while this helper owns scalar chord convergence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps original rounding, iteration budget and final Newton update; it does not invent outside geometry or a missing derivative.

## @evidence contracts/development/common.md#meaningful-documentation

Width/from are world mm, direction is chart change per scalar l, and start is the optional remaining chord guess.

## @evidence contracts/development/implementation.md#efficient-algorithms

One initial and at most steps callback evaluations, plus one final admission reading when converged.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each admitted jet supplies its current chord, speed and rate without a second query in that iteration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scalar iterate and callback references have call lifetime; no retained search or global cache exists.
