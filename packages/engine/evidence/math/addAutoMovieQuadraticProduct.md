# src/math/addAutoMovieQuadraticProduct.ts#addAutoMovieQuadraticProduct

## @evidence contracts/development/implementation.md#principled-implementation

IEEE binary64 TwoProduct and TwoSum retain first-order product/addition errors in a second component, following the cited Dot2 derivation; power-of-two scaling protects splitting near the finite exponent limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mutation adds one product to caller-owned scalar or vector accumulators, so sparse residuals, factors and homogeneous scalars share the same arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coefficient, row, objective term or tolerance is changed, no fixture selects arithmetic, and nonfinite values are not replaced by zero.

## @evidence contracts/development/common.md#meaningful-documentation

States interleaved layout, initialization premise, source algorithm, exponent scaling, underflow limitation and refusal propagation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and no allocation per product; callers retain two doubles per accumulated value and preserve their sparse traversal costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adds to the existing pair without allocating a product record or recomputing the preceding sum.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no storage; the caller owns and releases the supplied array.
