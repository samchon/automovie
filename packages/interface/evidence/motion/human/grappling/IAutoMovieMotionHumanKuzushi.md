# src/motion/human/grappling/IAutoMovieMotionHumanKuzushi.ts#IAutoMovieMotionHumanKuzushi

## @evidence contracts/development/common.md#meaningful-documentation

depth: How far forward the body tips about the ankles, degrees in (0, 30]; `DEPTH` when absent. hold: Seconds the tip is held; 1 when absent.

## @evidence contracts/development/design.md#principled-representation

depth: How far forward the body tips about the ankles, degrees in (0, 30]; `DEPTH` when absent. hold: Seconds the tip is held; 1 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/kuzushi.ts (kuzushi.plan, context); grappling/kuzushi.ts (kuzushi.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in kuzushi.plan.

# src/motion/human/grappling/IAutoMovieMotionHumanKuzushi.ts#IAutoMovieMotionHumanKuzushi.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

The tip's size and how long it is held.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The partner is named for the composition's mutual join; the tip itself reads only the body.
