# src/environments/furnishings/createFurnishedRoom.ts#createFurnishedRoom

## @evidence contracts/development/implementation.md#principled-implementation

Measures each authored piece's rest box once and hands the room to the shared planner, so every relation resolves from the drawn sizes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A thin public producer over `furnishRoom`; relation solving, clearance and staging stay with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no default piece, height or clearance.

## @evidence contracts/development/common.md#meaningful-documentation

States the room frame, the role and affordance paths, the mount output and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

One measurement per piece, then the planner's cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The module captures the parameters; each placement rebuilds its records from them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module retains only its parameters.
