# src/motion/human/compose/IAutoMovieMotionHumanArmAngles.ts#IAutoMovieMotionHumanArmAngles

## @evidence contracts/development/common.md#meaningful-documentation

fingers: The fingers' joints of that hand as the arm holds them, read off the pose with the arm; the posture's own when absent.

## @evidence contracts/development/design.md#principled-representation

fingers: The fingers' joints of that hand as the arm holds them, read off the pose with the arm; the posture's own when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmAngles.ts (AutoMovieMotionHumanArmAngles.angles, return); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry, from); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry.reading, fingers); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.planned.guesses, return); everyday/braceOnThigh.ts (braceOnThigh, rest); everyday/gestureHands.ts (gestureHands.planned, begin).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanArmAngles.ts#IAutoMovieMotionHumanArmAngles.IAngles

## @evidence contracts/development/common.md#meaningful-documentation

States which joints are held, the order of each triple and the unit.

## @evidence contracts/development/design.md#principled-representation

An arm that travels freely is described by its joint angles, the coordinates a free arm movement is smooth in (Soechting and Lacquaniti 1981).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, the three joints the arm channel owns; read by `angles` and `carry`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each triple is the posture's own joint triple, so it is written back without conversion.
