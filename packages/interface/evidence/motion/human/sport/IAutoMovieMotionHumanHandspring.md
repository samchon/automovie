# src/motion/human/sport/IAutoMovieMotionHumanHandspring.ts#IAutoMovieMotionHumanHandspring

## @evidence contracts/development/common.md#meaningful-documentation

lead: The leg that lunges; `left` when absent. height: The surface's height, world metres.

## @evidence contracts/development/design.md#principled-representation

lead: The leg that lunges; `left` when absent. height: The surface's height, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/handspring.ts (handspring.plan, context); sport/handspring.ts (handspring.over, context); sport/handspring.ts (handspring.over, surface).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanContactWindow.Support, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanHandspring.ts#IAutoMovieMotionHumanHandspring.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The leading leg.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The value the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union.

# src/motion/human/sport/IAutoMovieMotionHumanHandspring.ts#IAutoMovieMotionHumanHandspring.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A height, a support frame and a check of the place.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the vault gives the plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
