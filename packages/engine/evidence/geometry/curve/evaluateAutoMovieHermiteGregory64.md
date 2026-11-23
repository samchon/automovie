# src/geometry/curve/evaluateAutoMovieHermiteGregory64.ts#evaluateAutoMovieHermiteGregory64

## @evidence contracts/development/implementation.md#principled-implementation

Adds the two Hermite boundary interpolants and subtracts their corner tensor; each mixed corner entry is the rational distance blend of its two incident mixed derivatives, differentiated by the quotient rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One stateless evaluator consumes boundary jets without owning anatomy, topology, sampling or rendering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No corner row overwrite, finite-difference normal, coefficient fit or cubic-equivalence claim replaces the rational field.

## @evidence contracts/development/common.md#meaningful-documentation

States side order, cross-derivative direction, caller corner compatibility, rational degree distinction and removable corner handling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twelve boundary evaluations (four at the query coordinates and eight at endpoints) and a fixed sixteen-entry Hermite corner sum give constant work per query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each boundary sample supplies all four jet values; the same blended twist supplies position and both derivatives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All basis, corner and vector arrays are query-local; only three finite vectors escape, with no cache or external handle.
