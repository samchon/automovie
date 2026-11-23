# src/render/picture/IAutoMovieRasterLabel.ts#IAutoMovieRasterLabel

## @evidence contracts/development/design.md#principled-representation

Text and the pixel of the picture where its box starts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Capture drawing, draw results and draw legends exchange this same text and pixel anchor; the stamp owns glyph rendering, rounding and clamping.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A box that would leave the picture is moved inside it by the stamp rather than refused.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member holds and its frame.
