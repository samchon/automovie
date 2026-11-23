# src/motion/human/sport/IAutoMovieMotionHumanAthletics.ts#IAutoMovieMotionHumanAthletics

## @evidence contracts/development/common.md#meaningful-documentation

front: The front foot; with `on` and no `front`, the side of the placed front plate, otherwise `left`. on: Scene id of a starting block whose `front` and `rear` pedal affordances bear the feet; absent uses the body-scaled setting. sex: The sprinter's sex, the stratum whose measured centre-of-mass distance the set takes (`CENTRE`); `male` when absent. hold: Seconds held in the set; 1.5 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

front: The front foot; with `on` and no `front`, the side of the placed front plate, otherwise `left`. on: Scene id of a starting block whose `front` and `rear` pedal affordances bear the feet; absent uses the body-scaled setting. sex: The sprinter's sex, the stratum whose measured centre-of-mass distance the set takes (`CENTRE`); `male` when absent. hold: Seconds held in the set; 1.5 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.athletics, params); sport/athletics.ts (athletics.plan, context); sport/athletics.ts (athletics.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanAthletics.ts#IAutoMovieMotionHumanAthletics.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The front foot and the time held.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No block spacing in metres: the knees decide it.
