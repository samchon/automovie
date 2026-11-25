# src/motion/human/perform/IAutoMovieMotionHumanBlast.ts#IAutoMovieMotionHumanBlast.IBlast

## @evidence contracts/development/common.md#meaningful-documentation

point: Its centre, world metres. radius: How far it reaches, metres; positive. impulse: The impulse it delivers one metre from its centre, newton seconds; positive.

## @evidence contracts/development/design.md#principled-representation

point: Its centre, world metres. radius: How far it reaches, metres; positive. impulse: The impulse it delivers one metre from its centre, newton seconds; positive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanBlast.ts (HumanBlast.impulse, blast); perform/HumanPerformanceState.ts (HumanPerformanceState).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieMotionHumanScheduledInstant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
