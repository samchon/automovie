# src/human/generation/hand/IAutoMovieHumanHandDigitLaw.ts#IAutoMovieHumanHandDigitLaw.DigitAxesResult

## @evidence contracts/development/common.md#meaningful-documentation

Axes across a digit's line: toward the thumb's side and through the hand.

## @evidence contracts/development/design.md#principled-representation

Axes across a digit's line: toward the thumb's side and through the hand. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandDigitLaw.DigitAxesResult is the canonical exchange used by AutoMovieHumanHandDigitLaw.digitAxes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHandDigitLaw.digitAxes for axes across a digit's line: toward the thumb's side and through the hand.

# src/human/generation/hand/IAutoMovieHumanHandDigitLaw.ts#IAutoMovieHumanHandDigitLaw.IDigitStart

## @evidence contracts/development/common.md#meaningful-documentation

A digit's law from its anchors and its root.

## @evidence contracts/development/design.md#principled-representation

A digit's law from its anchors and its root. Alternatives are a record with centre, width, depth; null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandDigitLaw.IDigitStart is the canonical exchange used by AutoMovieHumanHandDigitLaw.digit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHandDigitLaw.digit for a digit's law from its anchors and its root.
