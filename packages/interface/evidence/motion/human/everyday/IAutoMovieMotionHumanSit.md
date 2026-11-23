# src/motion/human/everyday/IAutoMovieMotionHumanSit.ts#IAutoMovieMotionHumanSit.IParams

## @evidence contracts/development/common.md#meaningful-documentation

back: The seated back; `upright` when absent. hold: Seconds to stay seated after `seated`; 1 when absent. Inclusive minimum: 0. Unit: "s". legs: How the legs rest once seated on a seat inside the band: `parallel`, both feet where they stood, or `crossed`, the left ankle lifted and set down across the right one over `CROSS` seconds after `seated`, which the time seated must cover. `parallel` when absent; ignored on a high seat.

## @evidence contracts/development/design.md#principled-representation

back: The seated back; `upright` when absent. hold: Seconds to stay seated after `seated`; 1 when absent. Inclusive minimum: 0. Unit: "s". legs: How the legs rest once seated on a seat inside the band: `parallel`, both feet where they stood, or `crossed`, the left ankle lifted and set down across the right one over `CROSS` seconds after `seated`, which the time seated must cover. `parallel` when absent; ignored on a high seat.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.sit, params); everyday/sit.ts (sit.plan, context); everyday/sit.ts (sit.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSeated.ISeat, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
