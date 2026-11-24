# src/typography/IAutoMovieFontSegment.ts#IAutoMovieFontSegment

## @evidence contracts/development/common.md#meaningful-documentation

States the font-unit frame and axes, the TrueType origin of the quadratic form, the midpoint control of a straight piece and the chaining and closure invariants.

## @evidence contracts/development/design.md#principled-representation

One uniform quadratic Bézier per piece, the exact form TrueType outlines use; a line is the degenerate quadratic with a midpoint control, which traces the same points, so consumers handle one case.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The decoder writes it and engine flattening reads its three points; it reuses the shared two-component tuple.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional control or kind flag splits lines from curves into combinable states; chaining is a decoder invariant tests check.
