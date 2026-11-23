# src/motion/import/IAutoMovieExternalMotionRetargetHandoff.ts#IAutoMovieExternalMotionRetargetHandoff

## @evidence contracts/development/design.md#principled-representation

The retarget handoff forwards the admitted source rig, sorted mapping, dimensionless multiplier and unresolved target unchanged; it carries no invented destination rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its fields mirror the retarget decision minus the take id, so the receipt's take field is the single place the selected clip lives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The documentation keeps source conversion and source-target compatibility as downstream checks rather than implying ingest performed them.

## @evidence contracts/development/common.md#meaningful-documentation

The property comments say which values were checked, finite-positive scale and non-blank target, and that the target is not resolved here.
