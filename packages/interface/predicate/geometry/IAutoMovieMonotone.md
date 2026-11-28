# src/geometry/IAutoMovieMonotone.ts#IAutoMovieMonotone.ISlopeSlopes

## @evidence contracts/development/common.md#meaningful-documentation

Writable derivative destination with one scalar for each admitted knot.

## @evidence contracts/development/design.md#principled-representation

The monotone kernel writes first derivatives in ordinate units per knot unit and limits them against neighbouring secants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies and owns the destination capacity so this kernel can be used without additional allocations.
