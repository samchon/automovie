# src/architecture/IAutoMovieConnectorSection.ts#IAutoMovieConnectorSection

## @evidence contracts/development/design.md#principled-representation

A varying section is a piecewise-linear function of arc-length fraction, read by `builtConnectorSection` between the two stations bracketing the queried fraction; anchoring stations at both ends guarantees every fraction in `[0, 1]` has a bracket.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One station is a fraction and the two usable dimensions, and the list is the only spelling of a varying passage, so a constant passage keeps its two scalar fields on the connector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both or neither spellings are refused rather than one being preferred, and an unanchored or non-increasing station list is refused instead of being sorted or clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the either-or spelling rule, the list's anchoring, length and ordering rules, the interpolation between stations, the arc-length meaning of `at`, and the metre units and positivity of both dimensions.
