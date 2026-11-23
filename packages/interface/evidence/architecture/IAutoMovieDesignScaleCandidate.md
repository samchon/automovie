# src/architecture/IAutoMovieDesignScaleCandidate.ts#IAutoMovieDesignScaleCandidate

## @evidence contracts/development/design.md#principled-representation `validateDesignReference` requires a unique id within the frame, a finite metres-per-unit above zero, a confidence in `[0, 1]`, and a non-blank basis; `designFrameScale` returns the metres-per-unit of the candidate whose id the frame's `scale` names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Competing scale readings are kept side by side on the frame and one is chosen by id, so changing the chosen scale is a one-field edit that leaves every reading intact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No candidate is chosen automatically by highest confidence; a frame whose `scale` is null stays unscaled and its readings are withheld as `unknown-scale`.

## @evidence contracts/development/common.md#meaningful-documentation

States that only the named candidate converts points, that confidence is informational, the unit and positivity of the ratio, and what the basis records.
