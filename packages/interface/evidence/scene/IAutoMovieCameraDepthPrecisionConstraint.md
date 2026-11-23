# src/scene/IAutoMovieCameraDepthPrecisionConstraint.ts#IAutoMovieCameraDepthPrecisionConstraint

## @evidence contracts/development/design.md#principled-representation

Standard perspective reciprocal-depth mapping is evaluated at the declared minimum fixed-point bit count, comparing the worst adjacent eye-space step with an inclusive positive meter threshold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Capability and accepted quantization error remain authored together while actual required subject depth range comes from compiled camera grading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

More actual bits are permitted, fewer are refused, and logarithmic or reversed-depth implementations cannot masquerade as this standard metric.

## @evidence contracts/development/common.md#meaningful-documentation

Defines safe exact code-count premise, minimum bits, meter threshold and equality acceptance.
