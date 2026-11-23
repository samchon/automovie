# src/motion/human/sport/IAutoMovieMotionHumanSalto.ts#IAutoMovieMotionHumanSalto

## @evidence contracts/development/common.md#meaningful-documentation

to: The floor point to land on, world metres. apex: Apex height of the flight above take-off, metres; `APEX` of the stature when absent. way: Which way the body turns; `forward` when absent.

## @evidence contracts/development/design.md#principled-representation

to: The floor point to land on, world metres. apex: Apex height of the flight above take-off, metres; `APEX` of the stature when absent. way: Which way the body turns; `forward` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/salto.ts (salto.plan, context); sport/salto.ts (salto.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanSalto.ts#IAutoMovieMotionHumanSalto.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The landing place, the apex, the way and the turns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The way is a closed union and the turns are whole.
