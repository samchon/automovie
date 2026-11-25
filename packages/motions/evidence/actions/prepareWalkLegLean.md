# src/actions/prepareWalkLegLean.ts#prepareWalkLegLean

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/heading, world-metre varying joints, the forward-positive degree result and the body's lifetime; bounded additionally reports a reach beyond the body's total leg length before the knee geometry.

## @evidence contracts/development/implementation.md#principled-implementation

The knee lies on the cosine-law circle about the hip-to-ankle axis; of its two points whose shank keeps the foot's lateral axis perpendicular (no twist) the one at the least absolute swing is taken, and the shank's forward angle is projected from it. The bounded companion compares the hip-to-ankle length with thigh plus shank before that geometry, as the rocker room rule does. A leg along the forward axis, a vanishing reach or a straight knee leaves no bend plane and reads 0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private measured/axis preparation owns the knee geometry; the plain and bounded readers differ only by the reach screen before calling it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The degeneracy thresholds are numeric guards on unit-vector arithmetic, far under any posed leg's angles; the cosine is clamped only against rounding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation shares two length squares and the heading/lateral axes; each trial is constant work with no vector records, and wraps only the nearer knee-circle point where the principal readings decide it (both within `DECIDED`). A bounded trial computes its length once for the reach screen and the knee geometry. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller binds one measured body and heading for its rocker or stance; changing either needs another reader, while every hip/ankle is evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One caller-owned closure holds fixed lengths and axes until its stance/search releases it, with no hip, ankle, angle or time history; a reader borrows its two points for the call and keeps neither.
