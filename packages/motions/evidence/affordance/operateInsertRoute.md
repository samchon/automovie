# src/affordance/operateInsertRoute.ts#operateInsertRoute

## @evidence contracts/development/common.md#meaningful-documentation

States the depth's source, the threshold and its reason.

## @evidence contracts/development/implementation.md#principled-implementation

The threshold is where the hand would meet the muzzle's face: the grip's distance behind the working point less the hand's half breadth, for a grip whose distance from the working line is within that half breadth; a grip farther off the line passes beside the bore.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the depth, read the grip, branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A depth neither given nor declared is refused, never assumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One affordance scan and one held-tool read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the insertion's held-tool read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the routed context and plan.
