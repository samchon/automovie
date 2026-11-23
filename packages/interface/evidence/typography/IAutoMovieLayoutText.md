# src/typography/IAutoMovieLayoutText.ts#IAutoMovieLayoutText

## @evidence contracts/development/common.md#meaningful-documentation

States the box frame shared by every member: metres, origin at the bottom-left corner, `+x` right, `+y` up, and why it matches the font's own `+y` up outline.

## @evidence contracts/development/design.md#principled-representation

Groups the layout input and result in one box-local metre frame, so placement is a translation and a scale of font units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine's layout and glyph builders consume it; render reads the result through the text geometry it builds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pixel, face-fraction or surface frame is mixed in; render converts its face fraction to this box.

# src/typography/IAutoMovieLayoutText.ts#IAutoMovieLayoutText.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit, range and default, the wrap and line break rules and every refusal engine owns.

## @evidence contracts/development/design.md#principled-representation

Size in metres per em, a metre box, an alignment union and a relative line height are the quantities #4098 fixes; positivity and mapping are runtime checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is read by layoutAutoMovieText; the decoded font is passed in because engine cannot decode bytes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alignment is a closed union and the box is required, so no unbounded or unaligned state exists.

# src/typography/IAutoMovieLayoutText.ts#IAutoMovieLayoutText.IGlyph

## @evidence contracts/development/common.md#meaningful-documentation

States the placed code point, the baseline origin in box metres and the line index.

## @evidence contracts/development/design.md#principled-representation

A glyph origin on its baseline is the one point the outline is translated to.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The geometry builders translate each code point's shape to these origins; tests read the line index.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No geometry is duplicated per placement; shapes stay keyed by code point.

# src/typography/IAutoMovieLayoutText.ts#IAutoMovieLayoutText.ILine

## @evidence contracts/development/common.md#meaningful-documentation

States the kerned line width and the baseline height in box metres.

## @evidence contracts/development/design.md#principled-representation

Width and baseline are the measured facts alignment and stacking produce.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Callers read line widths for alignment checks and baselines for stacking.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No glyph list is repeated per line; glyphs carry their line index.

# src/typography/IAutoMovieLayoutText.ts#IAutoMovieLayoutText.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States the glyph order, which characters are omitted, line order, the first baseline rule and the scale.

## @evidence contracts/development/design.md#principled-representation

Placements, lines and the metres-per-unit scale together let a builder place each outline exactly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The text geometry and raised lettering builders read glyphs and scale; lines serve callers measuring the set text.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result is plain data with no font reference, so it cannot be mistaken for a decoded font.
