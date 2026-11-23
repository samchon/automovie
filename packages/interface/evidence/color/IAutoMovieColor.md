# src/color/IAutoMovieColor.ts#IAutoMovieColor

## @evidence contracts/development/design.md#principled-representation

Uses the glTF linear color convention; `linearColorToSrgbHex` and `srgbHexToLinearColor` apply the exact sRGB transfer function (the `0.0031308` and `0.04045` breakpoints, exponent `2.4`), and the material, light, fog and background validators range-check each linear component to `[0, 1]`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A numeric triple plus nullable alpha and label, so an authoring agent adjusts color numerically and the engine range-checks it, while the label stays an optional derived view rather than a second source of truth.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The triple is never re-derived from hex behind the author's back; shared validation refuses labels that differ from the quantized sRGB encoding instead of allowing material, light, fog and background slots to disagree about the same colour representation.

## @evidence contracts/development/common.md#meaningful-documentation

States linear channel authority and range, conversion helpers and eight-bit round trip, the unconverted-swatch error, nullable alpha, and case-insensitive agreement of an optional label with the quantized RGB swatch.
