# src/everyday/bedsidePerch.ts#bedsidePerch

## @evidence contracts/development/common.md#meaningful-documentation

States the entry stance, local edge convention, world placement, seated duration and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the named edge through the object's seat affordance and sequences the standard seated base transfer and return.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolves one affordance, then appends the two existing actions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the seat frame and depth from the bed. Reach, timing and pose stay with the action planners.

## @evidence contracts/development/implementation.md#efficient-algorithms

One lookup across the model's affordances, followed by two chain appends.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Resolves the seat once for the sit. The rise reads the resulting seated entry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result retains the appended action parameters as part of the caller's chain. The helper retains no state.
