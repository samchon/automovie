# src/geometry/boundAutoMovieProjectionSeparation.ts#boundAutoMovieProjectionSeparation

## @evidence contracts/development/implementation.md#principled-implementation

A separating-axis bound: convexity puts every hull point's projection between its vertices' projection extrema, so a positive gap between the two enclosed extrema divided by an upper bound on the direction's norm is a Euclidean lower bound by Cauchy-Schwarz; the gap and quotient are rounded downward with adjacent binary64 steps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Projection arithmetic is delegated to `measureAutoMovieProjectionIntervals`, and this function only compares the two runs' extrema and divides, so the convex bound and box pruning share one proof.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance turns a touch into a positive bound, and a zero or overlapping projection returns zero instead of an estimated distance.

## @evidence contracts/development/common.md#meaningful-documentation

States what a run represents, the admitted degenerate cases, what zero means and does not mean, what the bound does not qualify, every refusal and the consumers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the combined vertex count: one projection pass over both runs and one pass for each run's extrema, with one concatenated input array as the only allocation besides the intervals.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per candidate direction; the convex bound stops calling it once a direction suffices.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number; the concatenated run and intervals are released on return.
