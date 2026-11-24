# src/human/generation/hand/IAutoMovieHumanHandDigitLaw.ts#IAutoMovieHumanHandDigitLaw

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanHandDigitLaw exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups the caller's geometric source, the optional start and the resulting axes. Member contracts state their coordinate units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanHandDigitLaw; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace qualifies the geometric source and fit records. The runtime construction remains in Human.

# src/human/generation/hand/IAutoMovieHumanHandDigitLaw.ts#IAutoMovieHumanHandDigitLaw.IDigitSource

## @evidence contracts/development/common.md#meaningful-documentation

Declares the source's tip, ordered anchors, section size, sampling count and physical blend distance.

## @evidence contracts/development/design.md#principled-representation

The ordered anchor rows carry the three centre coordinates and two section reaches in millimetres. The pole is in the same hand chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplies AutoMovieHumanHandDigitLaw.digit with the caller's geometric data. Human owns evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The source carries only explicit geometry and a section sample count. It introduces no inferred material or fitted default.

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
