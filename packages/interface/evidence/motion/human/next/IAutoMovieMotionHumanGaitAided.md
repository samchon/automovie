# src/motion/human/next/IAutoMovieMotionHumanGaitAided.ts#IAutoMovieMotionHumanGaitAided

## @evidence contracts/development/common.md#meaningful-documentation

States the walks it holds and where the shared speed model, return and anchor are documented.

## @evidence contracts/development/design.md#principled-representation

One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
