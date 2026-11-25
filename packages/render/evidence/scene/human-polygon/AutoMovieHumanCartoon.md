# src/scene/human-polygon/AutoMovieHumanCartoon.ts#AutoMovieHumanCartoon.IExpression

## @evidence contracts/development/design.md#principled-representation

Unit names remain strings so unsupported requests survive to explicit reporting; sided activations and named lip values have the same [0,1] intensity semantics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes the consumed structural expression rather than depending on Human runtime enums or its skin deformation implementation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Tongue and viseme values are retained only for unsupported-field reporting, never claimed as drawn articulation.

## @evidence contracts/development/common.md#meaningful-documentation

States sided activation, neutral omission, duplicate-unit refusal and unsupported mouth fields.

# src/scene/human-polygon/AutoMovieHumanCartoon.ts#AutoMovieHumanCartoon.IHeadPose

## @evidence contracts/development/design.md#principled-representation

Gaze remains degrees and jaw displacement millimetres, converted once by the original face formulas; skeletal head orientation stays on the parent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates facial mark articulation from evaluator-owned neck/head transforms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This drawing contract introduces no clinical clamp, solver or anatomical motion claim.

## @evidence contracts/development/common.md#meaningful-documentation

Gives angle/displacement units, axis signs and neutral omission.
