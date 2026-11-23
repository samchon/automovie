# src/human/generation/hand/IAutoMovieHumanHandStar.ts#IAutoMovieHumanHandStar

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanHandStar exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups StarPointResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanHandStar; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the StarPointResult contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/hand/IAutoMovieHumanHandStar.ts#IAutoMovieHumanHandStar.StarPointResult

## @evidence contracts/development/common.md#meaningful-documentation

A star's `[b, c]` at a station and polar angle, held past its ends.

## @evidence contracts/development/design.md#principled-representation

A star's `[b, c]` at a station and polar angle, held past its ends. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandStar.StarPointResult is the canonical exchange used by AutoMovieHumanHandStar.starPoint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHandStar.starPoint for a star's `[b, c]` at a station and polar angle, held past its ends.
