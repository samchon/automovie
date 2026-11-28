# src/construction/IAutoMovieLoftSectionLegacy.ts#IAutoMovieLoftSectionLegacy.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies coefficient packing, row capabilities, derivative coordinate and retained-array lifetime.

## @evidence contracts/development/design.md#principled-representation

SectionLegacy.prepare selects one or three Hermite rows for the requested order and checks their widths. SectionLegacy.jet requires the three-row variant; phase evaluates the first row from either variant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant expresses each available capability over the existing spline layout. The owner can prepare only the value row when callers request a position or phase derivative.
