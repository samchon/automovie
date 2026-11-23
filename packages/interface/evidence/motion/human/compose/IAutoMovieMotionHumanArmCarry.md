# src/motion/human/compose/IAutoMovieMotionHumanArmCarry.ts#IAutoMovieMotionHumanArmCarry

## @evidence contracts/development/common.md#meaningful-documentation

from: Seconds since the action's start from which the arm is written. to: Seconds since the action's start until which the arm is written. span: The action's instants the arm's whole action is planned over as one trajectory (`AutoMovieMotionHumanArmPlanned.planned`): the reach, the hold on the goal's site and the return, in the clock's instants or as the weight states them (`AutoMovieMotionHumanArmPlanned.stated`); when absent, the deprecated joint-space carry (`carry`), kept until every law states its span.

## @evidence contracts/development/design.md#principled-representation

from: Seconds since the action's start from which the arm is written. to: Seconds since the action's start until which the arm is written. span: The action's instants the arm's whole action is planned over as one trajectory (`AutoMovieMotionHumanArmPlanned.planned`): the reach, the hold on the goal's site and the return, in the clock's instants or as the weight states them (`AutoMovieMotionHumanArmPlanned.stated`); when absent, the deprecated joint-space carry (`carry`), kept until every law states its span.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carried, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles, IAutoMovieMotionHumanPosture, IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanArmPlanned.ISpan identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanArmCarry.ts#IAutoMovieMotionHumanArmCarry.ICarry

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, its unit and the range of the weight.

## @evidence contracts/development/design.md#principled-representation

The span the arm is written over, the angles it holds at weight 0, the goal it solves to at weight 1 and the weight between them; with a span, the action's instants and what the planned trajectory needs of the hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sixteen members, all read by `carried` or by `AutoMovieMotionHumanArmPlanned`: seven that every carry needs, eight a planned arm reads (`span`, `perceived`, `tracked`, `together`, `on`, `disc`, `rests`, `grasp`) and the hand's `attitude`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The goal is the posture's own goal type as a function of the posture so far, so any owner of arm goals fits.
