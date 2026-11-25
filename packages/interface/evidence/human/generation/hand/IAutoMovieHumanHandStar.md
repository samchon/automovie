# src/human/generation/hand/IAutoMovieHumanHandStar.ts#IAutoMovieHumanHandStar.StarPointResult

## @evidence contracts/development/common.md#meaningful-documentation

A star's `[b, c]` at a station and polar angle, held past its ends.

## @evidence contracts/development/design.md#principled-representation

A star's `[b, c]` at a station and polar angle, held past its ends. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandStar.StarPointResult is the canonical exchange used by AutoMovieHumanHandStar.starPoint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHandStar.starPoint for a star's `[b, c]` at a station and polar angle, held past its ends.
