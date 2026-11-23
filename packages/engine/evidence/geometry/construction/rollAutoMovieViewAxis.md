# src/geometry/construction/rollAutoMovieViewAxis.ts#rollAutoMovieViewAxis

## @evidence contracts/development/implementation.md#principled-implementation

Projects the caller's signed direction into the actual endpoint normal plane and rotates the existing orthonormal u/v basis by a C2 scalar source; no centreline or tangent changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared scalar rotation and one frame wrapper implement the single interval contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixed anatomical angle, sampled frame, finite-difference production jet, initial-up rotation or world-axis substitution is used; failed premises return their diagnostic.

## @evidence contracts/development/common.md#meaningful-documentation

States millimetres, angle direction/half-turn convention, endpoint projection, shared quintic owner and constant relative transport.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation plus a two-knot source; each value/jet query reads its corresponding base callback once, one scalar value/jet and fixed trigonometric/product arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Measures the endpoint angle/source once; an analytic query reuses its base jet's value instead of reconstructing the course through a second at call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The wrapper retains its base axis and two-knot source only; frame vectors are invocation-local, and zero roll returns the base directly.
