# src/soft/validateSoftAnchors.ts#validateSoftAnchors

## @evidence contracts/development/common.md#meaningful-documentation

States every rule and why the findings keep their order.

## @evidence contracts/development/implementation.md#principled-implementation

Budget, identity, integer-range and vector admission through the shared primitive validators, and reference joins through the anchors' identity set.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the anchors, then one over the states and their poses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A second anchor on a particle, a moving anchor with a static position, a blank binding identity and an undeclared or repeated pose are each reported, never repaired.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in anchors plus state poses, with one identity set per collection.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared primitive validators.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The identity sets belong to the call; only the caller's collector is written.
