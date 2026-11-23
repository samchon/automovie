# src/props/createStageJacket.ts#createStageJacket

## @evidence contracts/development/implementation.md#principled-implementation

Builds real wall parts around each sleeve opening and one driven closure that shares its pose with the pull grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve dimensions, draw the garment and sleeve walls, then record one articulation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty sleeves use separate wall volumes. The actor's appearance model is independent.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size model per input.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The existing builder owns primitive geometry, articulated bindings and model collision shapes.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a complete model and retains no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Names model origin, axes, empty sleeve passages, and zipper geometry.
