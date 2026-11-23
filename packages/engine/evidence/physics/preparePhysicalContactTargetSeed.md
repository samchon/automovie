# src/physics/preparePhysicalContactTargetSeed.ts#preparePhysicalContactTargetSeed

## @evidence contracts/development/common.md#meaningful-documentation

States the plan precedence and its step and revision condition.

## @evidence contracts/development/implementation.md#principled-implementation

An authored root keeps its authored pose. A native root keeps its actual pose and the newest matching support, then balance, goals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One root decision selects goal, actual and interval-start poses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stale support or balance plan falls back to the authored segments.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work except one projection of the previous authored target for an authored root.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Individual and coupled tracking share this selection instead of copying it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows plan and scene maps. Only the authored-root actual map is new.
