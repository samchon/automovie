# src/drawing/autoMovieDrawingElementTriangles.ts#autoMovieDrawingElementTriangles

## @evidence contracts/development/implementation.md#principled-implementation

Places memoized model-frame triangles by the element's world matrix, which is the same composition the renderer stages, so the drawing reads the geometry the scene shows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single placement step that line drafting, opening fills and feature resolution share, separate from model lookup because each caller reports a missing model differently.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element or part is special-cased; part selection is the caller's explicit argument rather than a filter hidden here.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the frames, where tessellation comes from, why the model is resolved by the caller, the part default and the output order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the selected parts' triangle count: one concatenation and one transform per triangle, with tessellation reused from the index.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each part's tessellation through `design.partTriangles`, keyed by part identity within one derivation; the world placement is not cached because each element has its own matrix.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array owned by the caller; the concatenated model-frame list is a temporary.
