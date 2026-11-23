# src/index.ts#RecoveryChartReachableBox

## @evidence contracts/development/implementation.md#principled-implementation

An affine scalar row attains each coordinate extremum at the appropriate box endpoints, including signed weights. Exact binary64 decomposition into BigInt dyadics preserves the resulting row, and exact distance-squared comparison supplies a necessary single-observation feasibility condition without a coefficient solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure operation combines declared IDs, accumulates exact intervals and compares one target; outward number views and approximate distance diagnostics are separate from its exact predicate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normalization, epsilon deletion, coefficient clamp, coordinate matching, source geometry or inferred boundary ownership changes the supplied affine problem. Exactly canceled IDs remain in the unique-address count.

## @evidence contracts/development/common.md#meaningful-documentation

States millimetres, duplicate-sum order, exact float-row semantics, outward rounding, approximate distance, strict tolerance, failure effects and the limits of single-point feasibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

For T supplied terms the operation uses O(T) map work and O(T) exact arithmetic operations on bounded-exponent dyadics; integer width grows with the binary64 exponent range and log(T). There is no observation traversal, dense solve or geometry generation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Duplicate terms combine once before all three coordinate bounds, and their exact dyadic weights are reused across coordinates. A single local DataView decodes every binary64 input; no cross-call cache exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

maxTerms caps both supplied work and retained unique IDs. Call-local maps, BigInts and the eight-byte decoding buffer expire on return or throw; returned tuples own their numbers and no handles or input arrays are retained.
