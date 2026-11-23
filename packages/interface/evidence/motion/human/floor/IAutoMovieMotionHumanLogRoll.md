# src/motion/human/floor/IAutoMovieMotionHumanLogRoll.ts#IAutoMovieMotionHumanLogRoll

## @evidence contracts/development/common.md#meaningful-documentation

States the movement and every member's meaning.

## @evidence contracts/development/design.md#principled-representation

The side rolled toward, and either a count of half turns or a floor point to reach.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The side, the count or place, the end position and the manner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both or neither of a count and a place, and an entry not lying, are refused at runtime.

# src/motion/human/floor/IAutoMovieMotionHumanLogRoll.ts#IAutoMovieMotionHumanLogRoll.End

## @evidence contracts/development/common.md#meaningful-documentation

Names the two end positions, on the back or on the front.

## @evidence contracts/development/design.md#principled-representation

A closed union of the positions a whole number of half turns about the long axis reaches from lying.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The action's `end` member reads it to round a place's half turns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per position, with no optional fields to combine.
