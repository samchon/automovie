# src/motion/human/grappling/IAutoMovieMotionHumanHostageHold.ts#IAutoMovieMotionHumanHostageHold.Arm

## @evidence contracts/development/common.md#meaningful-documentation

Names the two places the holding arm lies across.

## @evidence contracts/development/design.md#principled-representation

A closed union of the two arm placements, across the chest or the neck.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams.arm` reads it and `hostageHold.plan` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per placement, with no optional fields to combine.

# src/motion/human/grappling/IAutoMovieMotionHumanHostageHold.ts#IAutoMovieMotionHumanHostageHold.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

Subject ids, an affordance id, a region, metres and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `hostageHold.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A weapon point requires the weapon; the law refuses one without it.

# src/motion/human/grappling/IAutoMovieMotionHumanHostageHold.ts#IAutoMovieMotionHumanHostageHold.IHeld

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The holder by subject id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `heldHostage.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hostage's path is read from the holder's own hold.
