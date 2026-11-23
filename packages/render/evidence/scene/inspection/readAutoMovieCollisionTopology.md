# src/scene/inspection/readAutoMovieCollisionTopology.ts#readAutoMovieCollisionTopology

## @evidence contracts/development/common.md#meaningful-documentation

States the cache key, the draw range rule and the null outcome.

## @evidence contracts/development/implementation.md#principled-implementation

Reads indices inside the draw range, rejects out-of-range indices and judges closure by directed-edge balance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader owns triangle extraction, bounds and closure for every collision source.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cut or misaligned draw range, normalized or non-three-component positions certify nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drawn indices once per buffer version.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cached per geometry by position, index and draw-range versions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A weak map releases the record with its geometry.
