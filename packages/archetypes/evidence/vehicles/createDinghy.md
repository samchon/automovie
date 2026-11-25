# src/vehicles/createDinghy.ts#createDinghy

## @evidence contracts/development/implementation.md#principled-implementation

Thin hull cells preserve the footwell, while native articulation carries rigid sail and helm parts and rebuilds the mainsheet between its own visible endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the reference, then draw the hull and its two independent rig branches.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sheet remains attached through articulation. The floor, sail panels, control grips and rudder come from real posed geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed authored parts and two independent degrees of freedom.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both side panels arise from the same hull sections. The moving sheet reuses the archetype span owner.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Model owns its mesh, physics and contact buffers.

## @evidence contracts/development/common.md#meaningful-documentation

States the reference, axes, contact-bearing parts and estimated dimensions.
