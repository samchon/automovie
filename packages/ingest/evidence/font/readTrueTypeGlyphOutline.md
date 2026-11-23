# src/font/readTrueTypeGlyphOutline.ts#readTrueTypeGlyphOutline

## @evidence contracts/development/implementation.md#principled-implementation

Decodes simple glyphs from their repeat-compressed flags and short or long deltas, turns on- and off-curve points into quadratic segments with implied midpoints, and resolves composites by the `x' = a·x + c·y + dx`, `y' = b·x + d·y + dy` transform of ISO/IEC 14496-22 section 5.3.4, with the offset unscaled by default. Straight pieces carry midpoint controls, which trace the same line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One module owns `glyf` parsing; private helpers split the span-checked read, simple glyphs, contour-to-quadratic conversion and composites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads outside the glyph's `loca` span, non-increasing end points, point-matched components, nesting past 16 levels and self-containing composites refuse; only zero-length pieces and pieceless contours are dropped, which carry no ink.

## @evidence contracts/development/common.md#meaningful-documentation

States the point decoding, the starting rule of an off-curve contour, the composite transform and offset rule, the cache contract and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the glyph's points and its components' transformed segments; the cache makes a shared component cost one decode.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's cache maps glyph index to its outline within one decode of one byte array, the only scope where equal indices mean equal outlines.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The cache is owned by the decoder call and grows by at most the glyph count; nothing outlives the decode.
