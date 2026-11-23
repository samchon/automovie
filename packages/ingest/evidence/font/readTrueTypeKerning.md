# src/font/readTrueTypeKerning.ts#readTrueTypeKerning

## @evidence contracts/development/implementation.md#principled-implementation

Reads format 0 subtables of the version 0 `kern` table (ISO/IEC 14496-22 section 5.7.4), keeping horizontal kerning values and adding them across subtables unless the override bit replaces them; minimum and cross-stream subtables do not advance glyphs and are skipped.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns glyph-pair kerning only; mapping pairs to code points stays with the decoder, which holds the inverse cmap.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Subtables are walked by their declared lengths with bounds checks; an Apple-format table is stated to contribute no pairs rather than misread as the OpenType layout.

## @evidence contracts/development/common.md#meaningful-documentation

States which subtables contribute, how values combine, the key form and the Apple-format case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the subtables and pairs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per decode.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one owned map bounded by the table's pairs; retains nothing.
