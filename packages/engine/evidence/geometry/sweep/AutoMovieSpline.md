# src/geometry/sweep/AutoMovieSpline.ts#AutoMovieSpline.fit

## @evidence contracts/development/implementation.md#principled-implementation

The tridiagonal continuity system of the spline under tension, solved by elimination, cyclic for a periodic profile by the Sherman-Morrison correction, and a bounded search for a tension accepted by the sampled overshoot check; the cap can return without acceptance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solve per trial tension and one overshoot scan, in the caller's arrays.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The search stops at the stated largest tension rather than looping.

## @evidence contracts/development/common.md#meaningful-documentation

States the arrays, the return and the search.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) per trial, 16 samples per segment for the scan with their hyperbolic weights tabulated once per trial, at most about 18 trials and one when the cubic already meets the bound; no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per profile change; the coefficients are the reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; writes only `m` and `scratch`.

# src/geometry/sweep/AutoMovieSpline.ts#AutoMovieSpline.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

The segment formula of the spline under tension, its cubic limit below a stated tension, and constant extension beyond an open profile's ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One evaluation for every caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No curve is extended beyond an open profile's knots.

## @evidence contracts/development/common.md#meaningful-documentation

States the extension and the wrap.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log n) binary search plus two hyperbolic sines, or a cubic, with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure evaluation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
