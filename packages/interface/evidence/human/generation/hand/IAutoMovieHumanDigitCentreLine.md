# src/human/generation/hand/IAutoMovieHumanDigitCentreLine.ts#IAutoMovieHumanDigitCentreLine

## @evidence contracts/development/common.md#meaningful-documentation

Publishes a constructed digit's centre line, apex and joint positions in registered-frame millimetres.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name. `line`: Points of the digit's centre line from its root at the web to its tip. `tip`: The tip's apex.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHandConstruction.lines.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `line`, `tip`, `joint`, `joints`; callers supply the complete record.
