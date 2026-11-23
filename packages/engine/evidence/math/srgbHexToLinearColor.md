# src/math/srgbHexToLinearColor.ts#srgbHexToLinearColor

## @evidence contracts/development/implementation.md#principled-implementation

Parses each eight-bit sRGB channel and applies the piecewise electro-optical transfer with threshold 0.04045, divisor 12.92 and exponent 2.4, then re-encodes the resulting linear triple to ensure its normalized hex label represents those same channels.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns strict six-digit swatch decoding and delegates the inverse label conversion to linearColorToSrgbHex; the scalar transfer helper is private because callers consume complete color records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every channel follows the same transfer law, malformed swatches throw and no palette or material identity receives a brightness compensation.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes display encoding from linear shader energy, explains midtone conversion, normalized round-trip labels and opaque alpha semantics.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed six-digit parse and three scalar transfer evaluations require constant time and no collection strategy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Decodes one immutable swatch per call without coordinating requests or retaining a mutable color cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Capture groups and the temporary triple are call-local, and the caller owns the returned linear color and normalized label.
