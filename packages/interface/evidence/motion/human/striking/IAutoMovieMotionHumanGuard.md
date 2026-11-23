# src/motion/human/striking/IAutoMovieMotionHumanGuard.ts#IAutoMovieMotionHumanGuard.Style

## @evidence contracts/development/common.md#meaningful-documentation

Describes how each choice places the gloves.

## @evidence contracts/development/design.md#principled-representation

A closed choice of sporting glove carriage, independent of the lead foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Guard and stepping parameters share the choice consumed by StrikingGuard.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Names the supported choices at the interface and leaves joint and reach geometry to the motion law.

# src/motion/human/striking/IAutoMovieMotionHumanGuard.ts#IAutoMovieMotionHumanGuard.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, minimum or default.

## @evidence contracts/development/design.md#principled-representation

A duration in seconds (raised to the setting time when planning), a closed union of stances, and the interface's motion target to face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The timing, stance, style and target the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's target union.
