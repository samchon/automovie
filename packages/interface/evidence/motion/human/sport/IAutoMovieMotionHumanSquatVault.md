# src/motion/human/sport/IAutoMovieMotionHumanSquatVault.ts#IAutoMovieMotionHumanSquatVault

## @evidence contracts/development/common.md#meaningful-documentation

hold: How long the landing is held, seconds; 0.5 when absent.

## @evidence contracts/development/design.md#principled-representation

hold: How long the landing is held, seconds; 0.5 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/squatVault.ts (squatVault.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in squatVault.plan.

# src/motion/human/sport/IAutoMovieMotionHumanSquatVault.ts#IAutoMovieMotionHumanSquatVault.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The box by its subject id and the landing's hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A subject id, resolved through the prop's own affordance.
