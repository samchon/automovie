# src/film/lookRotation.ts#lookRotation

## @evidence contracts/development/implementation.md#principled-implementation

An orthonormal look-at basis converted to a quaternion by Shepperd's method, which takes the branch with the largest diagonal term so the divisor stays away from zero; the x-major branch is omitted because a horizontal `x` gives `x.x = z.z/h` and `y.y = h`, so `x.x > y.y` forces a positive trace, and the near-vertical fallback keeps `x.x` at about `±1` with the positive case also inside the trace branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One aim rule shared by every camera move in `compileCameraMove` and by staging's initial aim, so a staged camera and a moving one keep the same horizon convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No direction is special-cased except the two degenerate inputs the basis cannot be built from, an up-parallel aim and a zero aim, each answered by a stated rule rather than a tuned value.

## @evidence contracts/development/common.md#meaningful-documentation

States the axis convention, horizon rule, normalized cross-product threshold and fallback, zero-direction identity, finite-input unit-length result up to rounding and non-finite propagation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-dimensional work normalizes the direction and right axis, forms two basis cross products with one extra cross product near vertical, then converts one branch and normalizes the output quaternion; zero direction returns before basis construction.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one vector that coordinates no work across calls; each keyframe aims along its own direction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a few temporary vectors and retains nothing; the caller owns the returned quaternion.
