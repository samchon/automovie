# src/motion/human/actions/IAutoMovieMotionHumanRun.ts#IAutoMovieMotionHumanRun.IParams

## @evidence contracts/development/common.md#meaningful-documentation

to: The floor point to stop at, world metres. pace: The gait, which fixes the speed; `run` when absent. via: Floor points passed in order before `to`, world metres.

## @evidence contracts/development/design.md#principled-representation

to: The floor point to stop at, world metres. pace: The gait, which fixes the speed; `run` when absent. via: Floor points passed in order before `to`, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/run.ts (run.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.run, params); actions/run.ts (run.GAITS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanGait.RunPace and IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
