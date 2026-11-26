# src/geometry/construction/triangulateAutoMovieSolidBoundary.ts#triangulateAutoMovieSolidBoundary

## @evidence contracts/development/implementation.md#principled-implementation

Uses convex-ear removal ordered by original occurrence arc, tip ID and lift. Periodic sampling locality is bounded by two adjacent original-walk phase primitives, while exact positive orientation, the consumer's half-period cover rule and represented strict interiors remain required. A new diagonal cannot strand a boxed original occurrence in an unrepresentable triangle; distinct cover edges cannot alias one global mesh edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One boundary-to-triangles function follows incidence/bridge preparation; it constructs neither points nor source curves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Changes no point or exact sign predicate and introduces no near-length tolerance. A distinct index is never ignored by positional equality and no tiny ear is removed without using its vertex. Locality remains a heuristic, not a completeness or world-normal certificate; unavailable represented cuts fail atomically.

## @evidence contracts/development/common.md#meaningful-documentation

States weakly simple positive input, cover identity, exact sign semantics, half-period search bound and failure behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(N) pass prepares periodic sampling locality. Each removal ranks N diagonals by fixed integer comparisons and checks improving candidates against remaining points, with cubic worst-case work and O(N) storage; no coordinate sorting, all-pair population or shortest-edge/Delaunay/continuous surface-error guarantee is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One occurrence table serves every removal; original chart values and cover coordinates are prepared once and no surface jet is reevaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The working ring and output have linear size, expire with the call except caller-owned fresh triangle triples, and retain no source map or callback.
