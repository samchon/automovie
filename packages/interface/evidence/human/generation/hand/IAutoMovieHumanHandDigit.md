# src/human/generation/hand/IAutoMovieHumanHandDigit.ts#IAutoMovieHumanHandDigit

## @evidence contracts/development/common.md#meaningful-documentation

A digit's law in the hand form's axes: its centre line, the half width and half depth of its sections along it, the way its section's phase turns, and its rounded tip.

## @evidence contracts/development/design.md#principled-representation `centre`: Centre of its root at the web, where its line starts. `line`: Natural splines of the line's three coordinates over the length along it, mm of the form. `width`: `[length, half width]` knots across the digit, mm of the form.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandDigitLaw.digit. Read by AutoMovieHumanFingerBones.of, AutoMovieHumanHandDigitBones.onBones, AutoMovieHumanHandDigitChain.fingerOf. Also types AutoMovieHumanHandDigitLaw.tube, AutoMovieHumanHandForm.digits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `line`, `width`, `depth`, `angles`, `first`, `clear`, `cap`, `pole`; callers supply the complete record.
