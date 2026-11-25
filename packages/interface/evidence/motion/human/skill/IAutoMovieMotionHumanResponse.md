# src/motion/human/skill/IAutoMovieMotionHumanResponse.ts#IAutoMovieMotionHumanResponse.Latency

## @evidence contracts/development/common.md#meaningful-documentation

mean: Normal reaction-delay mean, seconds; drawn delays are floored at zero. spread: Normal reaction-delay standard deviation, seconds.

## @evidence contracts/development/design.md#principled-representation

mean: Normal reaction-delay mean, seconds; drawn delays are floored at zero. spread: Normal reaction-delay standard deviation, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: skill/HumanResponse.ts (HumanResponse.latency, latency); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.latency).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanResponse.latency.
