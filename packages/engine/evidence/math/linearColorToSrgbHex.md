# src/math/linearColorToSrgbHex.ts#linearColorToSrgbHex

## @evidence contracts/development/implementation.md#principled-implementation

The sRGB linear toe and exact one-over-2.4 power precede eight-bit rounding; finite out-of-gamut channels project to the displayable interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One encoder derives swatches from linear RGB beside the inverse decoder instead of independently authored palette labels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite channels refuse rather than writing hexadecimal NaN, while gamut clipping follows the documented display contract.

## @evidence contracts/development/common.md#meaningful-documentation

States linear input, lowercase RRGGBB output, quantized inverse relation, clipping and nonfinite refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three transfer evaluations and fixed-width conversions take constant work for a seven-character swatch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each current color channel is encoded once; mutable color records have no shared label cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Three temporary channel strings form the returned swatch, and the input color is not retained.
