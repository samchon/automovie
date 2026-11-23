# src/recovery/IAutoMovieRecoveryImageBackground.ts#IAutoMovieRecoveryImageBackground

## @evidence contracts/development/design.md#principled-representation

A declared RGB reference and channel-distance threshold specify the deterministic foreground predicate; shadows and similar foreground colours remain acquisition limitations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named classification record is independent of camera calibration and scan budgets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No trained segmentation, per-object mask or hidden background estimate is supplied.

## @evidence contracts/development/common.md#meaningful-documentation

Defines byte channels, inclusive threshold comparison and the supported positive threshold range.
