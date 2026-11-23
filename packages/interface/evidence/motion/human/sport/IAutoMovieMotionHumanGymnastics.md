# src/motion/human/sport/IAutoMovieMotionHumanGymnastics.ts#IAutoMovieMotionHumanGymnastics

## @evidence contracts/development/common.md#meaningful-documentation

hold: Seconds held inverted; 2 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

hold: Seconds held inverted; 2 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.gymnastics, params); sport/gymnastics.ts (gymnastics.plan, context); sport/gymnastics.ts (gymnastics.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanGymnastics.ts#IAutoMovieMotionHumanGymnastics.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
