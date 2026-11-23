# src/math/createAutoMovieQuadraticConstraintBasis.ts#createAutoMovieQuadraticConstraintBasis

## @evidence contracts/development/implementation.md#principled-implementation

Column-pivoted Householder QR factors normalized working normals without normal equations; only tautological rows and exact zero-singleton identities merge, while dimension-scaled rank ambiguity refuses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record supplies range, nullspace, triangular factors and particular point together with working ordinals and multiplier divisors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

General numerical dependencies are never silently discarded; nonrepresentable normalization or reconstruction reports a reason and leaves partial factors unusable.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed coefficients, owned factors, structural reductions and numerical rank refusal required by the working-set step.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N variables and K working rows, QR costs O(N times K squared); complete basis reconstruction costs O(N squared times K), with O(N squared plus K squared) dense storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same reflectors reconstruct the particular point and all basis columns; a changed working set requires new factors.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned factors belong to the caller; normalized columns and reflectors become unreachable on success or refusal, with no retained row cache.
