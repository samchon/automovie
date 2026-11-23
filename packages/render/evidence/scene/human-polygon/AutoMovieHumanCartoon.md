# src/scene/human-polygon/AutoMovieHumanCartoon.ts#AutoMovieHumanCartoon

## @evidence contracts/development/common.md#meaningful-documentation

States drawing-only expression, intensity, angle and displacement units.

## @evidence contracts/development/design.md#principled-representation

Represents Generator-independent inputs consumed by the original cartoon face drawing: companion namespace of 2 members (`IExpression`, `IHeadPose`); units and frames named in its text: degrees. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieHumanCartoon` in packages/render/src/scene/human-polygon/AutoMovieHumanCartoon.ts; its surface is the 2 members listed and the text shows 4 other files naming it, mostly packages/render (3), movies (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.

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
