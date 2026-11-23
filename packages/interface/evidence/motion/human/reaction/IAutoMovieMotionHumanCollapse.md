# src/motion/human/reaction/IAutoMovieMotionHumanCollapse.ts#IAutoMovieMotionHumanCollapse

## @evidence contracts/development/common.md#meaningful-documentation

States each direction's path and terminal pose, the two tones, the sag and the floor rest, with their sources.

## @evidence contracts/development/design.md#principled-representation

Closed unions for the direction, the side and the tone, a blow source and seconds; the law refuses a sideways fall without a side it can read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters the registered `collapse` law reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member combines into a meaningless state: the side is read only by a sideways fall, the source only for its heading.

# src/motion/human/reaction/IAutoMovieMotionHumanCollapse.ts#IAutoMovieMotionHumanCollapse.Direction

## @evidence contracts/development/common.md#meaningful-documentation

Names the four directions of a collapse; the namespace states each one's path and terminal pose.

## @evidence contracts/development/design.md#principled-representation

A closed union of the directions the body can go down in, relative to its heading or in place.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams` reads it and `collapse.plan` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per direction; the side a sideways fall needs is a separate member the other directions leave unread.

# src/motion/human/reaction/IAutoMovieMotionHumanCollapse.ts#IAutoMovieMotionHumanCollapse.Tone

## @evidence contracts/development/common.md#meaningful-documentation

Names the two tones; the namespace states how each meets the floor.

## @evidence contracts/development/design.md#principled-representation

A closed union of an unbraced fall and one that breaks the fall.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams` reads it and `collapse.plan` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per tone, with no optional fields to combine.

# src/motion/human/reaction/IAutoMovieMotionHumanCollapse.ts#IAutoMovieMotionHumanCollapse.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

Seconds and closed unions; the law refuses a negative time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `collapse.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The side is optional because only a sideways fall reads it, and it then defaults to the side away from the blow.
