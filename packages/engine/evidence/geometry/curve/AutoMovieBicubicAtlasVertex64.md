# src/geometry/curve/AutoMovieBicubicAtlasVertex64.ts#AutoMovieBicubicAtlasVertex64

## @evidence contracts/development/implementation.md#principled-implementation

Canonical identities, fan reuse, arithmetic admission and allocation order retain the original vertex construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.

## @evidence contracts/development/common.md#meaningful-documentation

States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each new vertex uses existing edge, corner, fan and local-map lookups plus fixed-degree evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared registries and the cursor are the same objects across chunks; currentChunk prevents retaining an obsolete yielded chunk.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The factory borrows generator state and retains no external resource; its patch-local closure expires after that patch.
