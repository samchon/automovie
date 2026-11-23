# src/internal/index.ts#IProjectionSegment

## @evidence contracts/development/design.md#principled-representation

A contiguous protected span records original and projected starts and byte length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mapping reconnects projection mismatches to untouched source positions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only protected spans are mapped; owned metadata receives no fabricated coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

Properties distinguish original and projected byte coordinates.
