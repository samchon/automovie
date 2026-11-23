# src/geometry/sweep/compileAutoMovieSweepProfile.ts#compileAutoMovieSweepProfile

## @evidence contracts/development/implementation.md#principled-implementation

Separates scalar C2 interpolation from the positive radius/scale domain that consumes it; admission preserves the interpolant and refuses values outside that domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared profile admission and query wrapper for sweep guides and scale.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses exact positivity and finiteness, with no clamp, fixture case or changed tension/tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

States the scalar overshoot limitation, input span, diagnostic ownership and delayed query refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K) admission plus the K-knot spline compile; each query adds a constant domain check to the spline's O(log K) evaluation and allocates only when refusing an invalid result.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One compiled immutable scalar spline serves every query of this profile; different owners or inputs compile independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned query retains its scalar spline and diagnostic string, released with the owning sweep; input station arrays are copied by the scalar compiler and are not retained by this wrapper.
