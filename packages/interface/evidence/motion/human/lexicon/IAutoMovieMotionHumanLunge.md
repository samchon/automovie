# src/motion/human/lexicon/IAutoMovieMotionHumanLunge.ts#IAutoMovieMotionHumanLunge

## @evidence contracts/development/common.md#meaningful-documentation

Names the horse, the line hand, the line contact, the whip, the film-second duration and the take-up and let-go interval.

## @evidence contracts/development/design.md#principled-representation

One base action on one prop for the whole lunge; positive timing that leaves a hold between taking up and letting go the line is checked when the action is planned, and reach at each sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The horse prop owns the circle and the line's world frame; this record names only what the handler does.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No circle, radius or line position is supplied here; they are read from the prop.
