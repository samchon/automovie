# src/validation/validateColor.ts#validateColor

## @evidence contracts/development/implementation.md#principled-implementation

Validates the canonical linear color representation and derives the optional display label through linearColorToSrgbHex's sRGB transfer and eight-bit rounding; only admitted RGB channels enter that conversion, alpha stays independent and case changes preserve the same hexadecimal swatch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one color gate used by materials, staged atmosphere and lights, scene backgrounds and production artifacts, so scalar bounds and label consistency cannot acquire different rules in those consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reports authored values without clamping or replacing channels from hex; every supported color slot applies the same optional-label rule, and invalid RGB does not provoke a secondary conversion exception.

## @evidence contracts/development/common.md#meaningful-documentation

Gives linear channel ranges, nullable alpha and hex semantics, the quantized sRGB agreement rule, case-insensitive labels, alpha independence, error paths and the dependent-check skip on out-of-range RGB.

## @evidence contracts/development/implementation.md#efficient-algorithms

Checks a fixed five-field record with three range checks and at most one three-channel sRGB encoding, constant time and space independent of scene or material population.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validates the caller's current mutable color once; there is no identity or content revision for safely caching verdicts across later authoring edits.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no color or conversion result after return; the caller's collector owns one finding per invalid scalar/label field.
