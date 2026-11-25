# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsTakeoff.ts#IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff

## @evidence contracts/development/common.md#meaningful-documentation

plan: The jump's plan; its postures up to `seconds` are the push-off. seconds: The take-off, seconds of the plan. centre: The centre of mass at the take-off, world metres.

## @evidence contracts/development/design.md#principled-representation

plan: The jump's plan; its postures up to `seconds` are the push-off. seconds: The take-off, seconds of the plan. centre: The centre of mass at the take-off, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/GymnasticsTakeoff.ts (GymnasticsTakeoff.of, return); sport/GymnasticsTakeoff.ts (GymnasticsTakeoff.of); sport/highJump.ts (highJump.plan); sport/poleVault.ts (poleVault.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanActionPlan, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
