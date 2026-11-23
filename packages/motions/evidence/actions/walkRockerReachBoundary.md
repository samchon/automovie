# src/actions/walkRockerReachBoundary.ts#walkRockerReachBoundary

## @evidence contracts/development/common.md#meaningful-documentation

States the orbit, metres and degrees, and the verified reachable lower endpoint returned to the rocker.

## @evidence contracts/development/implementation.md#principled-implementation

Squared distance from hip to a circular orbit is a constant plus a single sinusoid. A reachable lower and unreachable upper endpoint on a sub-half-turn arc imply a unique increasing crossing. Solve that crossing, then check neighboring lattice points with the original reach predicate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare three fixed samples of the rigid orbit; read hip-dependent coefficients, solve the one crossing and verify the original bracket.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reject non-finite, ambiguous and unverified outputs so the original bounded search can run. This does not change the rocker room or the choice of fold.

## @evidence contracts/development/implementation.md#efficient-algorithms

A constant number of trigonometric and reach reads replaces logarithmically many trial pitches on the certified branch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed foot placement and axis define a single rigid orbit for the stance's hip reads. Independent hip inputs recompute the sphere-orbit intersection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Three fixed orbit vectors and the underlying stance reader are owned by the calling stance until it releases them.
