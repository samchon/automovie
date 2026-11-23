# src/motion/human/compose/IAutoMovieMotionHumanVariationPlace.ts#IAutoMovieMotionHumanVariationPlace

## @evidence contracts/development/common.md#meaningful-documentation

distance: The distance the hand travels in the arriving phase, metres. seconds: The length of the arriving phase, seconds; positive. direction: The direction of arrival in the nudge frame (`out`, `up`, `forward`); forward when absent.

## @evidence contracts/development/design.md#principled-representation

distance: The distance the hand travels in the arriving phase, metres. seconds: The length of the arriving phase, seconds; positive. direction: The direction of arrival in the nudge frame (`out`, `up`, `forward`); forward when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanVariationPlace.ts (AutoMovieMotionHumanVariationPlace.vary, travel); everyday/gesture.ts (gesture.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanTargetGrid.INudge identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanVariationPlace.ts#IAutoMovieMotionHumanVariationPlace.ITravel

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member states its unit, its frame and its value when absent.

## @evidence contracts/development/design.md#principled-representation

The distance and the time of the arriving phase, the two inputs of the impulse variability law, and the direction the end point's ellipse is longest along.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members read by `vary`; the phrase that arrives already has all three.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The direction is stated in the nudge frame the offset is read in, so no second frame enters.
