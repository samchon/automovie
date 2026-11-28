# src/schema/IAutoMovieHumanEarSchema.ts#IAutoMovieHumanEarSchema

## @evidence contracts/development/common.md#meaningful-documentation

Length, breadth and protrusion identify the auricle's measurement axis, cross-axis and separation from the scalp. The parent assigns the measured side.

## @evidence contracts/development/design.md#principled-representation

Typia bounds length to [15, 110] millimetres, breadth to [10, 70] and protrusion to [0, 50]. The head record pairs separately supplied ears.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The head schema reuses the same three measurements for each anatomical side. Ear placement remains a consumer operation.
