# src/typography/IAutoMovieFontKerning.ts#IAutoMovieFontKerning

## @evidence contracts/development/common.md#meaningful-documentation

States the source subtable, the code point mapping and duplication for shared glyphs, reading order and the value's sign and units.

## @evidence contracts/development/design.md#principled-representation

An ordered code point pair and an advance adjustment in font units, which is what layout applies between neighbours.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The decoder produces the pairs and layout consumes them by code point, so glyph indices stay inside ingest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only horizontal kerning values are represented; minimum and cross-stream data are not mixed in under the same field.
