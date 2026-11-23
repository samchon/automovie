# src/typography/buildAutoMovieRaisedLettering.ts#buildAutoMovieRaisedLettering

## @evidence contracts/development/implementation.md#principled-implementation

Lays the run out, extrudes each code point's regions with `extrudeAutoMovieRegion`, which yields a closed 2-manifold of volume area × depth, and translates each solid to its placement lifted by half the depth so it spans `z = 0` to `z = depth`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes layout, region grouping and the shared extrusion; it adds only placement, the lift and the code point label on a refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A nonpositive depth and a refused glyph reject; no letter is dropped or merged with another.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the z span, closure and volume, the attributes carried, how a production places it, determinism and refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each distinct code point is extruded once; placements cost linear copies of its buffers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Extruded solids are cached by code point within one call, where scale, tolerance and depth are fixed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one owned mesh linear in the placed glyphs' vertices; the cache is released with the call.
