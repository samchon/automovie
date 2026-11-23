# src/geometry/construction/AutoMovieSolidRail.ts#AutoMovieSolidRail.at

## @evidence contracts/development/implementation.md#principled-implementation

Orients kept-side directions from surface normals, solves chord offsets and square-mode normal sections, then maps host offsets across atlas faces under regular, representable chart arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One evaluator composes direction, scalar offset and two-equation section helpers while retaining explicit station/square part behavior.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Jets are admitted to actual owned domains before evaluation. Host boundary feet are only Newton initializers and a published rail must solve the unchanged plane/chord equations on a kept actual face; local branch convergence remains a premise.

## @evidence contracts/development/common.md#meaningful-documentation

Gives kept side, offset modes, chord/station units, nullable failures and the remaining multiple-hop/numerical validation limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Part offsets retain the bounded scalar/section solves; one host normal-section solve uses at most forty iterations, twenty trial halvings per iteration and four accepted chart changes. Surface/atlas callback costs are additional.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Initial jets supply normals, metric directions and the normal-section plane; this function owns no cache, while its join caller caches returned rails by parameter.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Iterates, jets and directions are call-local; only the fixed rail record/borrowed curve point escapes, with population retention delegated to its caller's cache.

# src/geometry/construction/AutoMovieSolidRail.ts#AutoMovieSolidRail.explain

## @evidence contracts/development/common.md#meaningful-documentation

States that it returns what `at` returns together with the quantities read and the premise a refusal failed, with each parameter's unit and meaning.

## @evidence contracts/development/implementation.md#principled-implementation

The single rail solve, its every early return naming the checked premise it failed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure `at` reads this one evaluator, so a reported refusal is the solve's own and not a reconstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Records the quantities without changing any of them, and adds no tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds a constant number of record writes to the solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same jets and directions feed the record and the rail.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record is call-local and returned; nothing is retained.
