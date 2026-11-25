# src/motion/human/throwing/IAutoMovieMotionHumanCatchObject.ts#IAutoMovieMotionHumanCatchObject.Hands

## @evidence contracts/development/common.md#meaningful-documentation

Names the two hand counts a catch takes.

## @evidence contracts/development/design.md#principled-representation

A closed union of the catch's two hand counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters' `hands` member and the catch presets read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per hand count, with no optional fields to combine.

# src/motion/human/throwing/IAutoMovieMotionHumanCatchObject.ts#IAutoMovieMotionHumanCatchObject.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The source anchor, prop and hand configuration identify the catch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ordinary and staged catch share the same hand options.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The referenced throw and ball supply the ordinary approach.

# src/motion/human/throwing/IAutoMovieMotionHumanCatchObject.ts#IAutoMovieMotionHumanCatchObject.IStageParams

## @evidence contracts/development/common.md#meaningful-documentation

States the stage-only interception time and its placement bounds.

## @evidence contracts/development/design.md#principled-representation

The ordinary hand parameters and optional positive elapsed time identify the capture on the anchored flight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only stageCatch admits the explicit interception time.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Performance supplies the contact point even for a specified interception time.

# src/motion/human/throwing/IAutoMovieMotionHumanCatchObject.ts#IAutoMovieMotionHumanCatchObject.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

object: The object's centre at a second of the action.

## @evidence contracts/development/design.md#principled-representation

object: The object's centre at a second of the action.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: throwing/catchObject.ts (catchObject.plan, return); executable/cases/throwCases.ts (throwCases.object).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/throwing/IAutoMovieMotionHumanCatchObject.ts#IAutoMovieMotionHumanCatchObject.IStageLaw

## @evidence contracts/development/common.md#meaningful-documentation

States that the law takes staged parameters and that its plan publishes the object path.

## @evidence contracts/development/design.md#principled-representation

An action law over `IStageParams` whose `plan` narrows the result to `IPlan`, so the object path is part of the law's type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One override of the action law's `plan`; `stageCatch` implements it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every other member is the action law's own.
