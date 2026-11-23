# src/motion/human/music/IAutoMovieMotionHumanConduct.ts#IAutoMovieMotionHumanConduct

## @evidence contracts/development/common.md#meaningful-documentation

Names the figures, the ictus rule and their source.

## @evidence contracts/development/design.md#principled-representation

A closed meter union, a bar count and the shared beat clock's tempo or cue-track lock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `conduct` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The figure is the meter's; no free path is authorable.

# src/motion/human/music/IAutoMovieMotionHumanConduct.ts#IAutoMovieMotionHumanConduct.Meter

## @evidence contracts/development/common.md#meaningful-documentation

Names the three meters; the namespace states each one's figure.

## @evidence contracts/development/design.md#principled-representation

A closed union of the meters with a standard beat figure in Rudolf's Grammar of Conducting.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams.meter` reads it and `conduct` chooses the figure by it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per meter, so a meter without a figure cannot be named.

# src/motion/human/music/IAutoMovieMotionHumanConduct.ts#IAutoMovieMotionHumanConduct.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the baton, the meter, the bars, the tempo, the lock and the hand.

## @evidence contracts/development/design.md#principled-representation

Beats per minute, a whole bar count and the dance beat clock's lock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inputs the law reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The baton must be held at entry.
