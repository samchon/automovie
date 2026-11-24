# src/validation/appendPracticalSurfacesArtifact.ts#appendPracticalSurfacesArtifact

## @evidence contracts/development/common.md#meaningful-documentation

States the diagnostic root, optional registry boundary and what targets and keys must resolve.

## @evidence contracts/development/implementation.md#principled-implementation

Target pairs are unique, time begins at zero, and finite keys strictly increase within the half-open shot interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Indexes target identities once and walks each track and its keys in source order. Failure reporting uses the shared violation helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses ambiguous track targets, missing model parts or materials when a registry is available, and out-of-order time even when no registry is available. Does not sort, fill or replace source keys.

## @evidence contracts/development/implementation.md#efficient-algorithms

An absent track list exits without allocations. Otherwise work scales with the scene and registry indexes, tracks and keys, plus each track's scans of its model's parts and materials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The request-local node and model indexes serve all tracks, and each track indexes its materials once before validating its keys.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrowed records are never changed, and only the caller's diagnostic list retains any failure values.
