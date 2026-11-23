# src/font/readTrueTypeCharacterMap.ts#readTrueTypeCharacterMap

## @evidence contracts/development/implementation.md#principled-implementation

Selects Unicode encoding records (platform 0, platform 3 encodings 1 and 10) and reads format 12 groups or format 4 segments exactly as ISO/IEC 14496-22 section 5.2.1 specifies, including the `idRangeOffset` indirection and modulo-65536 `idDelta`; glyph 0 and U+FFFF map nothing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only code point to glyph mapping; glyph decoding and metrics stay with the decoder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A mapping past the glyph count or U+10FFFF refuses, and a font with no supported Unicode subtable refuses rather than falling back to a symbol encoding.

## @evidence contracts/development/common.md#meaningful-documentation

States the accepted records and formats, the format preference and its reason, and each refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the mapped code points plus one sort of the result; segment arrays are bounds-checked once each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per decode; nothing is shared across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one owned map sized by the mapped code points; no reference to the bytes is retained.
