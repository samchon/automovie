# src/motion/human/grappling/IAutoMovieMotionHumanForceThrow.ts#IAutoMovieMotionHumanForceThrow

## @evidence contracts/development/common.md#meaningful-documentation

broken: Seconds from the action's start to the broken base. grip: The grip sites' mean height, world metres. remaining: Seconds the pull lasts after the broken base.

## @evidence contracts/development/design.md#principled-representation

broken: Seconds from the action's start to the broken base. grip: The grip sites' mean height, world metres. remaining: Seconds the pull lasts after the broken base.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceThrow.ts (HumanForceThrow.plan, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieResolveCenterOfMass.IModel, IAutoMovieVector3, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/grappling/IAutoMovieMotionHumanForceThrow.ts#IAutoMovieMotionHumanForceThrow.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The state of the pulled body at the broken base, the throw's initial condition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ten members, each read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The yield and the plant are the response's own functions, so the throw does not restate them.
