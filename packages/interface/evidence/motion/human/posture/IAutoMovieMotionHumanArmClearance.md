# src/motion/human/posture/IAutoMovieMotionHumanArmClearance.ts#IAutoMovieMotionHumanArmClearance.IArm

## @evidence contracts/development/common.md#meaningful-documentation

States the three members, their order and unit.

## @evidence contracts/development/design.md#principled-representation

The clinical triples a pose holds for the three joints of an arm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all written into the pose `room` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No side and no bone name: the functions that read it take the side.

# src/motion/human/posture/IAutoMovieMotionHumanArmClearance.ts#IAutoMovieMotionHumanArmClearance.IBaseline

## @evidence contracts/development/common.md#meaningful-documentation

States the two members, their unit and why they are apart.

## @evidence contracts/development/design.md#principled-representation

One allowance per reading, so a thick flank that the hanging forearm already touches lends no depth to the fingers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by `room`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No combined slack.
