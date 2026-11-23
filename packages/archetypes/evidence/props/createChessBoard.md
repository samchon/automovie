# src/props/createChessBoard.ts#createChessBoard

## @evidence contracts/development/implementation.md#principled-implementation

One slab of eight squares a side at FIDE's square size, plus a border; each square's socket at its centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record the dimensions, lay the slab, then the surface and the 64 square sockets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Border, thickness and mass are named provisional estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part and 65 contacts, one per square and the surface.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Names the source square size, the frame, the square naming and the sockets.
