# src/motion/human/compose/IAutoMovieMotionClockInstant.ts#IAutoMovieMotionClockInstant

## @evidence contracts/development/common.md#meaningful-documentation

A named instant measured in seconds since an action starts, distinct from a phase duration. AutoMovieMotionClock.of checks names and placement within its duration.

## @evidence contracts/development/design.md#principled-representation

A name and its time in seconds since the action's start, the unit every plan is evaluated in.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Clock construction, phrase adjustment and action planners exchange one name and one elapsed time; normalized plan events retain their separate IAutoMovieMotionEvent owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

AutoMovieMotionClock.of admits unique nonreserved names and seconds within the clock duration. Equal-shaped phase lengths are not accepted as a replacement semantic owner.
