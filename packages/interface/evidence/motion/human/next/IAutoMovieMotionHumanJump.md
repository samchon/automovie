# src/motion/human/next/IAutoMovieMotionHumanJump.ts#IAutoMovieMotionHumanJump

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Jump family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Jump laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanJump.ts#IAutoMovieMotionHumanJump.IParams

## @evidence contracts/development/common.md#meaningful-documentation

to: The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. on: The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. apex: Apex height of the flight above take-off, metres; positive. Exclusive minimum: 0. Unit: "m".

## @evidence contracts/development/design.md#principled-representation

to: The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. on: The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. apex: Apex height of the flight above take-off, metres; positive. Exclusive minimum: 0. Unit: "m".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jump.ts (jump.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.jump, params).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanJumpAirborne.IRotation, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
