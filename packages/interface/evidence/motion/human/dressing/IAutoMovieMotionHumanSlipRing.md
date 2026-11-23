# src/motion/human/dressing/IAutoMovieMotionHumanSlipRing.ts#IAutoMovieMotionHumanSlipRing

## @evidence contracts/development/common.md#meaningful-documentation

States who does what, where the ring ends and every member's meaning.

## @evidence contracts/development/design.md#principled-representation

The ring, the partner and the finger by its hand and its name; the place along the finger follows from the partner's bones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `slipRing` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A ring not held, a missing partner, the dresser as the partner and a finger out of reach are refused at runtime by the law.

# src/motion/human/dressing/IAutoMovieMotionHumanSlipRing.ts#IAutoMovieMotionHumanSlipRing.Finger

## @evidence contracts/development/common.md#meaningful-documentation

Names the four fingers a ring can be slipped onto.

## @evidence contracts/development/design.md#principled-representation

A closed union of the non-thumb fingers, so a thumb or an unknown finger cannot be named.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The `finger` member of the slip-ring action reads it to choose the finger's bones.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per finger, with no optional fields to combine.
