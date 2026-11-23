# src/drawing/draftAutoMovieDrawingLines.ts#draftAutoMovieDrawingLines

## @evidence contracts/development/implementation.md#principled-implementation

Classifies by signed plane distance, takes sections with `autoMovieDrawingCutEdges`, clips to the far half-space with `clipAutoMovieDrawingTriangles` and drafts silhouettes with `autoMovieDrawingSilhouetteEdges`, the conventional orthographic drafting pipeline; the premise is a validated design, so every boundary cites a space and every element has a world matrix, and the stated limitation, also declared as a gap by the caller, is that depth bands are not occlusion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns drawable collection, depth classification and stroke canonicalization, and the derivation calls it once; the drawable record and the stroke helpers are private because no other stage reads them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element, boundary or kind is special-cased; a face boundary realized by elements is skipped because the elements already draw it, by the stated one-pen rule, and an unresolvable model is counted for a gap instead of drawn as nothing silently.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which records become drawables and how filters apply, the boundary's space rule, the unresolved count, each depth band, the in-plane rule, and every canonicalization step and the sort order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drawn triangles for distance, section, clip and silhouette, with the depth range folded from a generator instead of a flattened array; deduplication is a hash map over strokes and the final sort is `O(L log L)` in the line count, which the canonical order requires.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Element geometry comes from the design index, so a model placed many times is tessellated once per derivation; each drawable's triangles are computed once and shared by its classification, cut and silhouette passes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The drawable list, drafted strokes and deduplication map live for the call and are released on return; the retained population is bounded by the drawn triangles, and only the returned lines, owned by the caller, survive.
