# src/cover/coverTravel.ts#coverTravel.sidle

## @evidence contracts/development/common.md#meaningful-documentation

States the lane, the facing and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The lane lies the trunk's half depth plus the gap off the face; the walk keeps the body facing away from or into the face while it travels along it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lane points, then one walk.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The walk owns its own clearance and timing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and one walk plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the walk's plan.

# src/cover/coverTravel.ts#coverTravel.window

## @evidence contracts/development/common.md#meaningful-documentation

States the crouch, where it applies and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The pelvis drop that puts the head under the sill follows from the standing head height; the walk carries it as its own lowered pelvis, so its feet are planned for the crouch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the window, admit the crouch, then one crouched walk.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The crouch is the sill's own need; a sill too low for it refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

One walk plan and constant work per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the walk's plan.
