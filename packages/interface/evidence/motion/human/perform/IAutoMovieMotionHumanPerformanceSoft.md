# src/motion/human/perform/IAutoMovieMotionHumanPerformanceSoft.ts#IAutoMovieMotionHumanPerformanceSoft.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

dt: The domain's step, seconds. steps: Every step's particle positions, step 0 the rest as boundaried, world metres row-major.

## @evidence contracts/development/design.md#principled-representation

dt: The domain's step, seconds. steps: Every step's particle positions, step 0 the rest as boundaried, world metres row-major.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of.solve, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.at); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.load); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of); perform/HumanPerformanceSoft.ts (SOLVED).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanPerformanceSoft.ts#IAutoMovieMotionHumanPerformanceSoft.IHandAnchor

## @evidence contracts/development/common.md#meaningful-documentation

particle: The particle. person: The person whose hand holds it. side: The hand.

## @evidence contracts/development/design.md#principled-representation

particle: The particle. person: The person whose hand holds it. side: The hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.held, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained.anchored, h); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained.anchored, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanPerformanceSoft.held.
