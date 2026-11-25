# src/human/generation/hand/IAutoMovieHumanDigitTipCap.ts#IAutoMovieHumanDigitTipCap.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A cap's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `radius`: The section's mean radius `sqrt(width * depth)` at an arc length along the line, mm. `length`: Arc length of the digit's apex along its line, mm. `from`: Arc length of the first section to search from, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitTipCap.start.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `radius`, `length`, `from`; callers supply the complete record.
