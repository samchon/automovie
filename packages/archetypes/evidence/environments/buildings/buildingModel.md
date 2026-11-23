# src/environments/buildings/buildingModel.ts#buildingModel

## @evidence contracts/development/common.md#meaningful-documentation

States model-local geometry, scoped identity, the swatch's color space and kinematic ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the canonical sRGB conversion and existing generated model and material records.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

All static masses, slabs and connectors use the same optical assembly without repeating material defaults.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No geometry is regenerated, scaled or assigned a guessed dynamic mass.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Wraps one geometry in constant time without copying its buffers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned model borrows the supplied geometry unchanged; equivalent callers may share that immutable input.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one part and one material and retains no handle or cache.
