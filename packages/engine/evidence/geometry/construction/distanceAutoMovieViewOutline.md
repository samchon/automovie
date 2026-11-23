# src/geometry/construction/distanceAutoMovieViewOutline.ts#distanceAutoMovieViewOutline

## @evidence contracts/development/implementation.md#principled-implementation

For each original cubic/quintic span forms (S-targetStation)S'+(R-targetValue)R' in its unit parameter. Station/root inverses have degree one/two, giving derivative degree at most five/nine. MIT Patrikalakis-Maekawa-Cho section 7.2.1 gives the squared-distance stationarity and separate boundary comparisons; the shared numerical root owner states its residual and conditioning limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One source-only operation owns coefficient assembly and delegates polynomial roots and station inversion to their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads prepared source coefficients without fitting samples, mutating source values, clamping roots or substituting linear support; unsupported parameters and unrepresentable coefficient arithmetic return a failure.

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed-chart/common-unit premise, explicit closed subset, singleton result, derivative degrees and numerical proof limits; https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node135.html is the geometric basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits n spans with degree d<=9; O(60*n*d*2^d+n log n) work covers derivative-root recursion and sorting of the O(n) bounded-degree candidate list. No source sampling grid is used.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses admitted natural curvatures or requested Hermite coefficients and their original parameter partition without another spline solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Invocation-local degree-at-most-nine rows and at most 511 root observations per span join O(n) endpoint/knot candidates; no cache, handle or source retention survives the call.
