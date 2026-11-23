# src/motion/human/lexicon/IAutoMovieMotionHumanLeadHorse.ts#IAutoMovieMotionHumanLeadHorse

## @evidence contracts/development/common.md#meaningful-documentation

Names the support, the hand, the rope contact, the film-second duration and the acquire and release intervals.

## @evidence contracts/development/design.md#principled-representation

One named contact on one prop for one arm over a finite interval; positive timing that leaves a hold between acquiring and releasing is checked when the action is planned, and reach at each sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The walk owns travel and feet and the horse prop owns the rope's world frame; this record names only what the arm does.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No rope position, horse course or handling technique is supplied here; the rope is read from the prop.
