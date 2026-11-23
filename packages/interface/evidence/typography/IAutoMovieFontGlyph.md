# src/typography/IAutoMovieFontGlyph.ts#IAutoMovieFontGlyph

## @evidence contracts/development/common.md#meaningful-documentation

States the code point key, the advance's source table and units, flattened composites, per-code-point copies, contour closure and the winding convention consumers must not rely on.

## @evidence contracts/development/design.md#principled-representation

A glyph keyed by Unicode scalar value carries its advance and closed quadratic contours in font units; composites are already resolved, so no invalid component reference can exist in the record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Layout reads the code point and advance, glyph geometry reads the contours; nothing else is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No glyph index or bounding box is stored that a consumer could confuse with layout data; empty contours represent an outline-less glyph instead of an optional field.
