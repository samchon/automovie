# src/posture/placeHumanHandSurface.ts#placeHumanHandSurface

## @evidence contracts/development/common.md#meaningful-documentation

States local/world frames, metre units, unchanged quaternion policy, cold borrowed-rotation ownership and prepare's copied fixed geometry/fresh output contract.

## @evidence contracts/development/implementation.md#principled-implementation

Rigid placement puts the wrist at at-minus-turn(local). Cold calls preserve exact rotate-then-subtract grouping; prepare computes that same fixed rotated offset once and applies the original subtraction to every actual world target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One numeric assembly owner serves cold wrist placement and its fixed-geometry prepared companion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rotation normalization, contact approximation, target snapping or tolerance is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original quaternion-vector rotation and subtraction per cold call; fixed consumers may prepare the rotation of their immutable offset once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cold and prepare use the same final placed assembler. The prepared producer copies local offset and quaternion values before computing one shift, isolating caller/output edits; changed fixed geometry requires another preparation and no target point is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Cold placement retains nothing and returns a fresh point with borrowed rotation. A prepared action owns one quaternion and shifted vector until release, returning fresh point/rotation records without a body, time history, input record or handle.
