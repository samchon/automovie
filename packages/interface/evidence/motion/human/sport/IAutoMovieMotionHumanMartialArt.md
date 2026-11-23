# src/motion/human/sport/IAutoMovieMotionHumanMartialArt.ts#IAutoMovieMotionHumanMartialArt

## @evidence contracts/development/common.md#meaningful-documentation

count: Punches of a choku-zuki series; 4 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. hold: Seconds the stance is held; 1 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

count: Punches of a choku-zuki series; 4 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. hold: Seconds the stance is held; 1 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.martialArt, params); sport/martialArt.ts (martialArt.plan, context); sport/martialArt.ts (martialArt.plan); executable/cases/martialArtCases.ts (martialArtCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanMartialArt.ts#IAutoMovieMotionHumanMartialArt.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The named form, series count and hold with a lead override for stance phrases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/sport/IAutoMovieMotionHumanMartialArt.ts#IAutoMovieMotionHumanMartialArt.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the kinds as named solo movement and reset phrases from standing.

## @evidence contracts/development/design.md#principled-representation

Closed choices distinguish the admitted held techniques and the linked stance phrases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanChainSport.martialArt accepts this vocabulary through IParams. The martialArt law selects its support phrase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses explicit stable literals. Runtime admission remains with the generated action schema.
