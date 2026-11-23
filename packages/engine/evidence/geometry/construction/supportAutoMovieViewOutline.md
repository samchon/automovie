# src/geometry/construction/supportAutoMovieViewOutline.ts#supportAutoMovieViewOutline

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the original prepared cubic/quintic and the exact station inverse in the same parameter, using polynomial roots or finite derivative-root recursion for the angle term. This applies only to a caller-established affine station origin and fixed chart direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar operation returns the stations a fixed-plane consumer evaluates with its existing source and affine origin; it neither constructs a world curve nor changes its input.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled maximum, fitted source, sine polynomial, clamp, moving-axis premise or final-skin readback is introduced; arithmetic/domain failures remain explicit.

## @evidence contracts/development/common.md#meaningful-documentation

States the affine function, units, closed subdomain, constant-offset independence and numerical root limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits n prepared source spans with degree at most five; each span has bounded-degree polynomial or sine-polynomial root work, then the finite O(n) candidate list is sorted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the existing natural curvatures or Hermite coefficients without rebuilding their spline, jets or source parameter.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns an invocation-owned O(n) station list and bounded-degree temporary rows per span; no source or global cache is retained.
