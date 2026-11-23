# src/motion/human/compose/IAutoMovieMotionHumanArmCarry.ts#IAutoMovieMotionHumanArmCarry.ICarry

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, its unit and the range of the weight.

## @evidence contracts/development/design.md#principled-representation

The span the arm is written over, the angles it holds at weight 0, the goal it solves to at weight 1 and the weight between them; with a span, the action's instants and what the planned trajectory needs of the hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seventeen members, all read by `carried` or by `AutoMovieMotionHumanArmPlanned`: seven that every carry needs, nine a planned arm reads (`span`, `perceived`, `tracked`, `together`, `on`, `disc`, `rests`, `grasp`, `hold`) and the hand's `attitude`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The goal is the posture's own goal type as a function of the posture so far, so any owner of arm goals fits.
