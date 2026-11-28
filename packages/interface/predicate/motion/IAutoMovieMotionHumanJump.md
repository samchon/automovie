# src/motion/IAutoMovieMotionHumanJump.ts#IAutoMovieMotionHumanJump.IVerticalContest

## @evidence contracts/development/common.md#meaningful-documentation

The parameters identify the two-foot high-hands action, the centre-of-mass height above take-off and the effect of manner on its ground phases.

## @evidence contracts/development/design.md#principled-representation

A vertical contest has one positive finite apex. The actual stance supplies its footprint and heading. Gravity gives its flight clock from the apex, and manner scales the lowering and return.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller provides a height and optional manner. The law reads the initial foot and body geometry and decides whether those feet can support the chosen movement.

# src/motion/IAutoMovieMotionHumanJump.ts#IAutoMovieMotionHumanJump.IVerticalContest.apex

## @evidence contracts/development/common.md#meaningful-documentation

The value measures positive finite metres of centre-of-mass rise from the moment both feet leave the floor.

# src/motion/IAutoMovieMotionHumanJump.ts#IAutoMovieMotionHumanJump.IVerticalContest.manner

## @evidence contracts/development/common.md#meaningful-documentation

Manner controls how much time the body has to lower and return. Gravity sets the airborne duration.
