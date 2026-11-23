# src/motion/human/everyday/IAutoMovieMotionHumanStepOver.ts#IAutoMovieMotionHumanStepOver.IParams

## @evidence contracts/development/common.md#meaningful-documentation

lead: The leading foot; `right` when absent. manner: How it is performed: the manner's tempo scales the whole crossing's time, every phase keeping its share; neutral when absent.

## @evidence contracts/development/design.md#principled-representation

lead: The leading foot; `right` when absent. manner: How it is performed: the manner's tempo scales the whole crossing's time, every phase keeping its share; neutral when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainTravel.ts (HumanChainTravel.stepOver, params); everyday/stepOver.ts (stepOver.plan, context); everyday/stepOverPath.ts (stepOverPath.of, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
