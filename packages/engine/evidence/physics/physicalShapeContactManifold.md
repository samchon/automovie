# src/physics/physicalShapeContactManifold.ts#physicalShapeContactManifold

## @evidence contracts/development/implementation.md#principled-implementation

The textbook clipping construction: support features along the normal, polygon clipping in the contact plane and the lift onto both features.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Feature, hull, clip, lift; one helper per step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The band is the caller's; no point count is capped and no case is guessed.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V log V) for the hulls and O(V^2) clipping in the features' vertex counts, eight at most for a box.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh points; retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the support features, the band, the projection, each intersection case, the lift and the empty case.
