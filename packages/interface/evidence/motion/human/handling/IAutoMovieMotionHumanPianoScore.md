# src/motion/human/handling/IAutoMovieMotionHumanPianoScore.ts#IAutoMovieMotionHumanPianoScore

## @evidence contracts/development/common.md#meaningful-documentation

Defines the instrument and which inputs belong to the score.

## @evidence contracts/development/design.md#principled-representation

Represents the phrase as keyed, timed contacts in the instrument's own numbering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owns only the input to the registered pianoScore law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the canonical hand and digit identities.

# src/motion/human/handling/IAutoMovieMotionHumanPianoScore.ts#IAutoMovieMotionHumanPianoScore.INote

## @evidence contracts/development/common.md#meaningful-documentation

Identifies each physical phase and its clock origin.

## @evidence contracts/development/design.md#principled-representation

Describes one independently moving key, with both hand and digit named.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains only the target, fingering and four authored phase boundaries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The prop supplies travel, position and surface normal.
