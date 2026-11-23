# src/index.ts#assertRecoveryImageChart

## @evidence contracts/development/implementation.md#principled-implementation

Finite distinct image-edge bounds and a pixel-to-frame scale test precede inverse mapping of row centres and support-cell edges. Round-trip integer/chart bounds, adjacent-row spacing and eight-connected interval adjacency preserve the fixed-background observation schema.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Observation and saved-observation fitting share one numerical chart admission owner rather than applying different camera/pixel conventions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate rounding changes observations, missing row is interpolated into a claimed measured row or epsilon denominator repairs a collapsed chart.

## @evidence contracts/development/common.md#meaningful-documentation

States millimetres, pixel centres/edges, conditional roundoff tolerance, contiguous support and refusal for unrepresentable frame gauges.

## @evidence contracts/development/implementation.md#efficient-algorithms

Setup and each row check use fixed-count arithmetic without a pixel scan or per-image buffer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned closure reuses its camera scalars and roundoff bound for all rows of that view only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A constant-size borrowed-camera closure survives for one synchronous operation; no image, handle, global cache or task is retained.
