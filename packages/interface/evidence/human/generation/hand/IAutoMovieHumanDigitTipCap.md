# src/human/generation/hand/IAutoMovieHumanDigitTipCap.ts#IAutoMovieHumanDigitTipCap

## @evidence contracts/development/common.md#meaningful-documentation

The radius law and arc-length search interval used to locate a digit's distal cap. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanDigitTipCap exchanges the named IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/hand/IAutoMovieHumanDigitTipCap.ts#IAutoMovieHumanDigitTipCap.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A cap's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `radius`: The section's mean radius `sqrt(width * depth)` at an arc length along the line, mm. `length`: Arc length of the digit's apex along its line, mm. `from`: Arc length of the first section to search from, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitTipCap.start.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `radius`, `length`, `from`; callers supply the complete record.
