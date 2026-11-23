# src/motion/human/lexicon/IAutoMovieMotionHumanHoldHandles.ts#IAutoMovieMotionHumanHoldHandles

## @evidence contracts/development/common.md#meaningful-documentation

Names the support, the two handle contacts, the film-second duration and the acquire and release intervals.

## @evidence contracts/development/design.md#principled-representation

Two named contacts on one prop for both arms over a finite interval; positive timing that leaves a hold between acquiring and releasing is checked when the action is planned, and reach at each sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The walk owns travel and feet and the prop owns the handles' world frames; this record names only what the arms do.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No handle position or implement course is supplied here; the handles are read from the prop.
