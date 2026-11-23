# src/motion/human/next/IAutoMovieMotionHumanReaction.ts#IAutoMovieMotionHumanReaction

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Reaction family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: reaction/HumanReaction.ts (HumanReaction.report, shot).

# src/motion/human/next/IAutoMovieMotionHumanReaction.ts#IAutoMovieMotionHumanReaction.IReportShot

## @evidence contracts/development/common.md#meaningful-documentation

point: World-space location where the shot is fired, metres; sound travels from this source to the listener. seconds: Shot instant in performance seconds.

## @evidence contracts/development/design.md#principled-representation

point: World-space location where the shot is fired, metres; sound travels from this source to the listener. seconds: Shot instant in performance seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: reaction/HumanReaction.ts (HumanReaction.report, shot).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
