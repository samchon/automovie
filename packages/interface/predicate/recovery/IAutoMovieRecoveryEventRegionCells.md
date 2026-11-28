# src/recovery/IAutoMovieRecoveryEventRegionCells.ts#IAutoMovieRecoveryEventRegionCells.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The callable exposes work owned by one query, including source bounds, raw nodes and the original-face-to-retained-cell index.

## @evidence contracts/development/design.md#principled-representation

Clip the reference triangle, preserving original source edge provenance. Distinguish flat boundary faces and lower-dimensional contacts from dimension-two intersections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The builder owns mutable local cell records and automated clipping issues. Later topology and port stages update these records with measured memberships.
