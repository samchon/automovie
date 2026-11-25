# src/motion/human/grappling/IAutoMovieMotionHumanDisarm.ts#IAutoMovieMotionHumanDisarm.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the two weapons a disarm is staged for; the namespace states each technique.

## @evidence contracts/development/design.md#principled-representation

A closed union of the weapons with a staged technique, so an unstaged weapon cannot be named.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams.kind` reads it and `disarm.plan` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per weapon, with no optional fields to combine.

# src/motion/human/grappling/IAutoMovieMotionHumanDisarm.ts#IAutoMovieMotionHumanDisarm.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

Subject ids, a closed kind, a side and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `disarm.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law refuses a partner who does not hold the weapon and a lever out of reach.

# src/motion/human/grappling/IAutoMovieMotionHumanDisarm.ts#IAutoMovieMotionHumanDisarm.IYield

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The defender by subject id and its disarm by anchor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `disarmed.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law reads the defender's own disarm instead of restating its timing.
