# src/film/propOccupancyBounds.ts#propOccupancyBounds

## @evidence contracts/development/implementation.md#principled-implementation

Bounds a declared footprint by eight transformed corners or unions measured part-vertex boxes under staged placement. The shared builtPlacedPartBoxes empty-vertex fallback is a zero box at Matrix4.position of that placement, preserving the staged node's origin while representing no occupied extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Piece placement is `setPieceMatrix`, the footprint transform is `transformedBoxBounds` and the part measurement is `builtPlacedPartBoxes`, the same rules buildings, clearances and staging use; this file keeps only the footprint-over-geometry precedence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No prop or model kind is special-cased; a vertexless model uses the shared staged-origin zero-box fallback, and external appearance is measured by its registered proxy rather than guessed from unavailable bytes.

## @evidence contracts/development/common.md#meaningful-documentation

States the footprint precedence and why, how parts are measured, that rotation widens the box, what is measured for an external appearance and the remedy when the proxy is crude, the origin collapse, and the frame and unit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time for a footprint; otherwise linear in the model's summed vertex count, folded per part without materializing a world point array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The staged matrix is composed once per call and reused for every part; tessellation is not cached across calls because the prop record is the caller's mutable data.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps the per-part boxes only until they are unioned and retains nothing; the caller owns the returned box.
