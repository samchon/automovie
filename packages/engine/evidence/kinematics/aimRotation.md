# src/kinematics/aimRotation.ts#aimRotation

## @evidence contracts/development/implementation.md#principled-implementation

The shortest arc between two unit vectors is the rotation about their cross product by `atan2(|a x b|, a . b)`, which `rotationBetween` computes without a near-parallel deadzone; normalizing first removes the magnitudes the angle does not depend on, and the documented zero-vector identity is `rotationBetween`'s degenerate branch rather than a separate rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct and prepare entries own named finite refusal and delegate every numerical turn to rotationBetween's same core; the prepared reader adds only lazy successful source admission/normalization for the two-bone workload.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite inputs retain named refusal, every target still validates, and no small angle is snapped. Preparation stores nothing until original source-then-target validation succeeds and requires an unchanged borrowed source; direct calls keep live reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

Direct aiming checks six components and normalizes both directions. prepare checks/normalizes its fixed source once after successful first target admission; each later target retains three checks and the actual constant shortest-arc solve, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only prepare's successful normalized source is shared under its explicit unchanged-source premise; target failure before that leaves the reader unprepared and retryable. No target, angle or rotation is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct temporaries end with the call. A prepared closure borrows its source and owns at most one normalized-source reader/vector until caller release, with no global collection, target history or handles.

## @evidence contracts/development/common.md#meaningful-documentation

States direction frames, unit rotation, collinear behavior and refusal; prepare's child documentation defines unchanged-source lifetime, lazy original-order admission, per-target checks and caller release.
