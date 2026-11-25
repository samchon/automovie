# src/executable/IMotionCaptureCase.ts#IMotionCaptureCase

## @evidence contracts/development/common.md#meaningful-documentation

States the frame of every pose and point and the reproducibility premise.

## @evidence contracts/development/design.md#principled-representation

Performers sample poses by film seconds; overlays are world points; verdicts are named booleans with their measured detail.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the capture harness; every member is drawn or reported by it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface pose and vector types and Human's canonical body.
