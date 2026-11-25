# src/posture/HumanColliderCorners.ts#HumanColliderCorners

## @evidence contracts/development/common.md#meaningful-documentation

States the shared consumers, each shape's probes, their frame and units.

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the audit's existing surface sampling for every collider kind so the planner reads the same corners in both directions of a collision pair.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exhaustive branch per collider kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The points follow from the collider's dimensions; no body, action, clearance or contact tolerance is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

A hull reuses the engine's cached hull faces; every other kind has a fixed number of probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One canonical generator serves the audit and the planner instead of duplicating the audit's sampling.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the probes and retains no state.
