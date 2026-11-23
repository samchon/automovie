# src/geometry/sweep/interpolateAutoMovieMonotone.ts#interpolateAutoMovieMonotone

## @evidence contracts/development/implementation.md#principled-implementation

Fritsch and Carlson's monotone piecewise cubic Hermite interpolation: zero slopes at sign changes and the radius-3 restriction are the published sufficient condition for each segment to stay monotone, so values never overshoot their neighbouring knots; the periodic form applies the same rule to secants taken across the wrap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation and a closure over `AutoMovieMonotone`, which owns slope selection and evaluation for this and every in-place caller; the sweep's stations, guides and scale, and periodic section radii, all call it rather than each carrying its own spline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsorted or duplicate knots are refused instead of sorted or merged, and extrapolation holds end values instead of extending a cubic beyond the data.

## @evidence contracts/development/common.md#meaningful-documentation

States the overshoot guarantee, the slope rule and its source, continuity, open extrapolation, periodic wrapping and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) to compute the n slopes once; each evaluation is one O(log n) binary search and a cubic, with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The returned closure is the reuse: callers build it once per profile and evaluate it many times.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains copies of the knots, values and slopes, O(n), released with the closure.
