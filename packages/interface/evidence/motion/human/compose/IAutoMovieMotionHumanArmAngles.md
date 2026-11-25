# src/motion/human/compose/IAutoMovieMotionHumanArmAngles.ts#IAutoMovieMotionHumanArmAngles.IAngles

## @evidence contracts/development/common.md#meaningful-documentation

States which joints are held, the order of each triple and the unit.

## @evidence contracts/development/design.md#principled-representation

An arm that travels freely is described by its joint angles, the coordinates a free arm movement is smooth in (Soechting and Lacquaniti 1981).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, the three joints the arm channel owns; read by `angles` and `carry`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each triple is the posture's own joint triple, so it is written back without conversion.
