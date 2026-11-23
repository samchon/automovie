# src/physics/physicalContactTargetBones.ts#physicalContactTargetBones

## @evidence contracts/development/common.md#meaningful-documentation

Specifies which local bones can supply coordinates in a fit.

## @evidence contracts/development/implementation.md#principled-implementation

Unions active collider chains and point-bound chains or takes all joints for the declared self-avoidance behavior.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One selection serves both the optimizer and mutual dependency admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Weight-zero bindings contribute no movable chain; all admitted point bounds contribute their chains.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads each active chain once; the set collapses overlapping chains before probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The legacy fit and the coupled fit use the same coordinate selection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a local ordered collection and holds no data after the call.
