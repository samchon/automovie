# src/human/skeleton/IAutoMovieFitHumanPhysicalStandingPose.ts#IAutoMovieFitHumanPhysicalStandingPose.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States the provider and world/metre premises and the bounded solve settings.

## @evidence contracts/development/design.md#principled-representation

Each declared provider segment has one actual authored world transform.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the original profile and world transforms as the sole pose inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Accuracy and iteration budget are explicit and the authored ground plane is not inferred from a moved pose.

# src/human/skeleton/IAutoMovieFitHumanPhysicalStandingPose.ts#IAutoMovieFitHumanPhysicalStandingPose.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines outcome indicators, residual units and when a residual exists.

## @evidence contracts/development/design.md#principled-representation

Only the fitted case supplies a complete native pose. A refusal may retain an unresolved geometric residual.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result carries just the native goals, measured residual or cause of refusal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missed fit cannot be consumed as a native standing target.
