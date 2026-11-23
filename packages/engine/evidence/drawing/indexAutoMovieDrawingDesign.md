# src/drawing/indexAutoMovieDrawingDesign.ts#indexAutoMovieDrawingDesign

## @evidence contracts/development/implementation.md#principled-implementation

Hash maps keyed by the design's unique ids, world matrices from the architecture owner that `lowerBuiltEnvironment` and every element-measuring query share, and memoization keyed by part object identity, which is sound because the index serves one derivation over an environment nobody edits meanwhile.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One index replaces the per-call linear lookups and repeated tessellations that the drawing, the schedule and feature resolution each performed, and it owns no derivation logic of its own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element, model or boundary is special-cased; a builder-owned runtime model is simply absent from the model map, which callers report as a gap.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states what is indexed, which staging the matrices use, the memo and its scope, the validity precondition and its failure, and the ownership of the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in elements, models and boundaries for the maps plus linear staging of the element hierarchy; tessellation is deferred until a part is first asked for, so models nobody draws cost nothing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares each part's tessellation across every element placing its model, every opening filled by it and every feature resolved on it within one derivation; equivalence is part object identity in an environment that does not change during the derivation, and a new derivation builds a new index, so nothing stale survives an edit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the index for one derivation; it holds three id maps, one matrix per element and at most one triangle list per tessellated part, bounded by the design's size, and all of it is released with the index when the derivation returns.
