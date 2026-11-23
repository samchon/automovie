# src/handling/readPianoPedal.ts#readPianoPedal

## @evidence contracts/development/common.md#meaningful-documentation

States the target, time, world frame and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the independent hinge's rest state and composes the plate and axis with the prop's rigid frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the hinge and carried plate, then resolve their world frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads dimensions and travel from the prop and requires a level plate with a coplanar lateral hinge.

## @evidence contracts/development/implementation.md#efficient-algorithms

Indexes the prop affordances once at action placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared articulation reader and rigid vector and quaternion operations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the resolved geometry and keeps no shared state.
