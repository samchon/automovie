# src/typography/IAutoMovieFont.ts#IAutoMovieFont

## @evidence contracts/development/common.md#meaningful-documentation

States the font-unit frame, the owners that decode and consume it, determinism, every metric's table and sign, the glyph and kerning order, the nullable descriptive fields, and the GPOS/GSUB exclusion with its reopening condition.

## @evidence contracts/development/design.md#principled-representation

Holds exactly the quantities layout needs in font units with the scale `unitsPerEm` beside them; the descender's negative sign follows `hhea`. Absent optional tables are `null`, not zero, so a missing `OS/2` is distinguishable from `fsType` 0. Uniqueness and order of glyphs are decoder invariants checked by tests.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`interface` owns it so `engine` layout reads it without depending on `ingest`; the ingest decoder produces it, render's font-source function returns it, and the names and `fsType` serve the licence review #4097 requires.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hinting, glyph index or table offset leaks into the record; it serves any TrueType font, not the test font.
