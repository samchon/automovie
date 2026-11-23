# src/typography/buildAutoMovieTextGeometry.ts#buildAutoMovieTextGeometry

## @evidence contracts/development/implementation.md#principled-implementation

Lays the run out, groups each code point's flattened contours into regions and triangulates them with `triangulateAutoMovieRegion`, whose ear clipping covers exactly outer rings less holes with counter-clockwise triangles, then translates them to each placement at `z = 0` with `+z` normals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes layout, region grouping and the shared triangulator; it adds only placement and the code point label on a triangulator refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refused glyph rejects the whole run with its code point named; nothing is hulled or skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, facing, coverage, determinism and refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each distinct code point is triangulated once; placements cost linear copies of its points and indices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Triangulations are cached by code point within one call, where scale and tolerance are fixed, so equal code points have equal shapes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned buffers linear in the placed glyphs' points; the cache is released with the call.
