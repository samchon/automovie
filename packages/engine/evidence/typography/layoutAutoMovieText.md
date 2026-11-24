# src/typography/layoutAutoMovieText.ts#layoutAutoMovieText

## @evidence contracts/development/implementation.md#principled-implementation

Implements #4098's layout: advances plus `kern` pairs scaled by `size / unitsPerEm`, greedy wrapping at the last U+0020 before the box width, `\n` breaks, the first baseline one scaled ascender below the box top, a line pitch of `lineHeight × (ascender − descender + lineGap)`, and start, centre or end alignment. A 1 nm allowance absorbs rounding of decimal scales only.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Layout owns placement only; flattening and triangulation stay in the geometry builders that call it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unmapped code point, a word wider than the box and overflowing lines refuse; no glyph is substituted and no text is clipped or shrunk to fit.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the advance and wrap rules, the baseline rule, alignment, every refusal and the rounding allowance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in code points with an incremental line width, plus a re-measure of the carried word after each break; the font's glyphs and kerning are mapped once per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one run; callers that set several runs from one font own any caching.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned arrays linear in the code points; the lookup maps are released with the call.
