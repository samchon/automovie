# src/index.ts#RecoveryAtlasObservationNormals

## @evidence contracts/development/implementation.md#principled-implementation

Each face uses (b-a) cross (c-a), retaining the original subtraction and multiplication order and source orientation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The caller admits the source and owns this one face-normal array for all selected interval observations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normalization, tolerance, winding correction, aliasing or source geometry substitution is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States the unnormalized source-normal convention, index order and ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over F triangular faces performs constant work per face and allocates F three-component arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller computes this array once and reuses it in every selected component's crease classification.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The observation call owns O(F) private normal storage; it is not published as engine geometry and is released with that call.
