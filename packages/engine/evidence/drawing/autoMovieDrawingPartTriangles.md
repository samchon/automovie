# src/drawing/autoMovieDrawingPartTriangles.ts#autoMovieDrawingPartTriangles

## @evidence contracts/development/implementation.md#principled-implementation

Reads the mesh's flat position and index arrays as the glTF-style triangle list they are, composing the part's TRS with `Matrix4.compose` as the renderer does; the premises are a whole-triple position array and in-range integer indices, which this function checks before reading any corner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function turns a part record into triangles for every drawing consumer, delegating recipe realization to realizeAutoMovieGeometry and point placement to transformAutoMovieDrawingPoint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No model, part or primitive is special-cased; malformed arrays throw instead of being truncated to the prefix that divides evenly.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the output frame, the primitive and imported-mesh sources, that winding is kept and why, every refused input and the failure type.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertex and index counts: one tessellation for a primitive, one pass over the indices, and a fresh index list only for an unindexed mesh, whose order defines its triangles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure in its arguments, so it caches nothing itself; `indexAutoMovieDrawingDesign` memoizes its result per part object for one derivation, so a model placed many times is tessellated once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array owned by the caller; the tessellated mesh and index list are temporaries released when the call returns.
