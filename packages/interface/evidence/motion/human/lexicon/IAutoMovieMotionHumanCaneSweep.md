# src/motion/human/lexicon/IAutoMovieMotionHumanCaneSweep.ts#IAutoMovieMotionHumanCaneSweep

## @evidence contracts/development/common.md#meaningful-documentation

States the technique, its variant and every member's meaning.

## @evidence contracts/development/design.md#principled-representation

The held cane, the hand, the technique and the span; every place follows from the body's measure and the walk's own steps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `HumanCaneSweep` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A cane not held, without a grip and a tip, too short to reach the floor, or a walk with no steps is refused at runtime.

# src/motion/human/lexicon/IAutoMovieMotionHumanCaneSweep.ts#IAutoMovieMotionHumanCaneSweep.Technique

## @evidence contracts/development/common.md#meaningful-documentation

Names the two cane techniques and how the tip meets the floor in each.

## @evidence contracts/development/design.md#principled-representation

A closed union of the two long-cane techniques, lifted touches or sliding contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sweep's technique member reads it and the cane-sweep law branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per technique, with no optional fields to combine.
