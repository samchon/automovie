# src/math/closestPointsBetweenSegments.ts#closestPointsBetweenSegments

## @evidence contracts/development/implementation.md#principled-implementation

Four boundary minima and a clipped stationary-line residual minimum cover the constrained segment quadratic; local scaling avoids determinant cancellation, while unrepresentable nonzero spans and witness distances refuse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner supplies both separation and contact witnesses to distance and collision consumers, including deterministic parameter ties.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No absolute parallel epsilon replaces interior minima; only exact zero coefficients select degeneracies.

## @evidence contracts/development/common.md#meaningful-documentation

Documents metres, fresh witnesses, the stationary-line construction, finite-arithmetic refusals, tie ordering and noncertified binary64 precision.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four boundary candidates and at most one stationary-line candidate retain constant-dimensional arithmetic. Ordered coordinate snapshots and direct scale arguments avoid admission arrays; one private residual vector serves every candidate instead of four vector intermediates per reading. When both spans are exact points no candidate workspace or reader closure is built, while initial and final distance readings remain unchanged.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Local differences and scaled dot products serve every candidate once. One residual formula writes the synchronous query's private vector, with no changed grouping; changed endpoints require a new query and final distance still comes from the rounded world witnesses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only two fresh witness points and their scalar distance escape. The residual scratch and scalar snapshots end with this call; input records, candidates and numerical results are never cached across calls.
