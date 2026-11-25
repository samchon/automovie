# src/motion/human/lexicon/IAutoMovieMotionHumanSwordGuard.ts#IAutoMovieMotionHumanSwordGuard.Guard

## @evidence contracts/development/common.md#meaningful-documentation

A guard, named by where the hilt is held.

## @evidence contracts/development/design.md#principled-representation

Closed choices "high", "shoulder", "middle", "low", "ox", "hanging", "tail" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSwordGuard.ts (HumanSwordGuard.GUARDS); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanSwordGuard.GUARDS.

# src/motion/human/lexicon/IAutoMovieMotionHumanSwordGuard.ts#IAutoMovieMotionHumanSwordGuard.IParams

## @evidence contracts/development/common.md#meaningful-documentation

guard: The guard; `middle` when absent. duration: Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

guard: The guard; `middle` when absent. duration: Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard, context); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSwordGuard.Guard identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
