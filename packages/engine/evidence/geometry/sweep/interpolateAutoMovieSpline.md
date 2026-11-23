# src/geometry/sweep/interpolateAutoMovieSpline.ts#interpolateAutoMovieSpline

## @evidence contracts/development/implementation.md#principled-implementation

The interpolating spline under tension (Schweikert 1966; Cline 1974), C2 for every tension, with tension selected by the stated finite sampled search; it does not strictly bound between-probe extrema or preserve positivity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation and a closure over `AutoMovieSpline`, which every in-place caller shares.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsorted or duplicate knots are refused instead of sorted or merged, and the curve holds its end values instead of extending a curve beyond the data.

## @evidence contracts/development/common.md#meaningful-documentation

States the continuity, the overshoot bound, the end and periodic rules, the degenerate cases and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) per trial tension to solve, usually one trial; each evaluation is an O(log n) search and two hyperbolic sines or a cubic, with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The returned closure is the reuse: callers build it once per profile and evaluate it many times.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains copies of the knots and values, their second derivatives and the tension, O(n), released with the closure.
