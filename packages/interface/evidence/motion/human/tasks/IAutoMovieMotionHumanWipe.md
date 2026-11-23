# src/motion/human/tasks/IAutoMovieMotionHumanWipe.ts#IAutoMovieMotionHumanWipe

## @evidence contracts/development/common.md#meaningful-documentation

hand: The hand; `right` when absent. count: How many circles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

## @evidence contracts/development/design.md#principled-representation

hand: The hand; `right` when absent. count: How many circles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.wipe, params); tasks/wipe.ts (wipe.plan, context); executable/cases/householdCases.ts (householdCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, AutoMovieHumanSide, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/tasks/IAutoMovieMotionHumanWipe.ts#IAutoMovieMotionHumanWipe.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its default.

## @evidence contracts/development/design.md#principled-representation

The surface's centre, the hand and the count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hand place is typed.
