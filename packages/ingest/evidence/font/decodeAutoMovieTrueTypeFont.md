# src/font/decodeAutoMovieTrueTypeFont.ts#decodeAutoMovieTrueTypeFont

## @evidence contracts/development/implementation.md#principled-implementation

Follows ISO/IEC 14496-22: the sfnt header and table directory, `head` units per em and `loca` format, `hhea` metrics, `maxp` glyph count, `hmtx` advances with the last full metric repeated, increasing `loca` offsets bounded by `glyf`, then the cmap, glyph, kern, `OS/2` and name readers. Only mapped glyphs are decoded, each once through the shared outline cache, and kerning is expanded from glyph pairs to every code point pair through the inverse cmap. Checksums are not verified, a stated limit: the asset ledger digest fixes the bytes. Composite components placed by matching point numbers are refused, a second stated limit with its reopening condition: point matching needs the font's numbered points of both outlines, which the decoded quadratic chains do not keep.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This function owns container admission, the directory and the small fixed-layout tables; the variable-layout tables each have one reader module, so every file stays small and one responsibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every unsupported container, missing table and out-of-range offset refuses with its own diagnostic; no missing glyph is replaced by `.notdef`, and no field is defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted versions, every refusal, every table read, the composite-glyph limit and its reopening condition, what is skipped (checksums, hinting, GPOS and GSUB through the record), purity and determinism.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the table directory, the glyph count for `loca`, the mapped code points and the decoded outline points, plus a sort of the kerning pairs; unmapped glyphs are never decoded.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Glyph outlines are cached by glyph index within one call, so a composite's components and code points sharing a glyph decode once; each code point receives its own copy so records share no arrays.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned record; the reader and the outline cache are released when the call returns, and the input bytes are only borrowed.
