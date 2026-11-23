# src/material/autoMovieProceduralCells.ts#autoMovieProceduralCells

## @evidence contracts/development/common.md#meaningful-documentation

Cites Worley 1996, states one feature point per cube, the 27-cube search and where it is exact.

## @evidence contracts/development/implementation.md#principled-implementation

Worley's cellular basis with one hashed feature point per lattice cube, the F1 and F2 Euclidean distances found over the neighbourhood Worley's own implementation searches.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the distances; stone combines them with the noise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limit of the neighbourhood is stated, not hidden, and the shader shares it, so CPU and GPU agree.

## @evidence contracts/development/implementation.md#efficient-algorithms

27 hashes and distances per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
