# src/motion/human/next/IAutoMovieMotionHumanBoardGame.ts#IAutoMovieMotionHumanBoardGame

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per composition of the BoardGame behaviour, each taking its own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tabletop compositions and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its composition; nothing is redefined.
