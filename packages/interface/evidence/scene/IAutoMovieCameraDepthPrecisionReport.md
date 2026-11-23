# src/scene/IAutoMovieCameraDepthPrecisionReport.ts#IAutoMovieCameraDepthPrecisionReport

## @evidence contracts/development/design.md#principled-representation

The evaluator inverts the standard depth codes bracketing requiredFar, where adjacent step is largest, and records exact operands and result; near-only range has zero step and floating code-boundary rounding may select a neighbouring cell.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Serializable input echoes and nullable measured fields distinguish malformed input, clipping refusal and inadequate precision from a satisfied metric.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Non-finite operands become null and never clamp into success; measured values remain absent until every range, capability and threshold premise holds.

## @evidence contracts/development/common.md#meaningful-documentation

Defines camera/time ownership, meter units, echoed invalid operands, code pair, measured step and the four outcomes with passed only for satisfaction.
