# src/schema/IAutoMovieHumanPoseSchema.ts#IAutoMovieHumanPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the reference pose, angular and jaw units and the conditions for a bilateral record. An omitted channel represents the neutral input.

## @evidence contracts/development/design.md#principled-representation

The six optional region blocks reuse their own metadata. The Human pose channel table assigns matching bounds, axes and signs. Its prepared evaluator applies numeric clamping when requested and uses a separate rig projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameter schema reuses this optional static pose. Subschemas keep units near their fields, and the evaluator owns combined transforms and any runtime clamping.
