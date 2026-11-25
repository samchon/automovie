# src/perform/bindHumanSimulationGrips.ts#bindHumanSimulationGrips

## @evidence contracts/development/common.md#meaningful-documentation

States which contact windows become grips, the chain, the receiver and the collider choice.

## @evidence contracts/development/implementation.md#principled-implementation

A grip of the reduced-order coupling (#3437, #3439) is the same hand-on-person relationship the engine's binding fits as motor intent (`IAutoMoviePhysicalContactBinding`); its colliders are the touching pair, measured with the engine's convex pair distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Finds the windows, maps their bones to the segments that carry them (the hand to its forearm when the window welds it) and picks the colliders among the hand's own; the per-step bindings and groups are the body planner's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No grip is assumed; a profile without the upper arm's or forearm's segment is refused by name instead of binding another chain, and the bound collider is always one of the hand's own, never the forearm's.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of the performers' contact windows; collider pairs are measured once per grip, at its first step.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh grip records; retains nothing.
