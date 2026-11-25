# src/observation/prepareAutoMovieRecoveryInput.ts#prepareAutoMovieRecoveryInput

## @evidence contracts/development/implementation.md#principled-implementation

The declared registration and the evaluated triangle population are handed to observation as they are, without interpreting container facts as geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Host evaluation and registration are separated from numerical observation while the public input shares one interface owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame, unit, pose, component, visibility or transform is inferred and no index is repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States the ingest handoff, borrowed ownership and absence of coordinate conversion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and storage: the vertex and triangle arrays are borrowed, not visited; only the uncertainty notes are copied.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The arrays are borrowed rather than copied, refitted or decoded again; their caller must keep them stable during observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No handle, worker or cache is acquired; the returned observation record borrows geometry and registration from the caller.
