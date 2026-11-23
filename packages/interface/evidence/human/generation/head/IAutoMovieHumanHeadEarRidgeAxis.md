# src/human/generation/head/IAutoMovieHumanHeadEarRidgeAxis.ts#IAutoMovieHumanHeadEarRidgeAxis

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanHeadEarRidgeAxis exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IOfResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanHeadEarRidgeAxis; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IOfResult contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/head/IAutoMovieHumanHeadEarRidgeAxis.ts#IAutoMovieHumanHeadEarRidgeAxis.IOfResult

## @evidence contracts/development/common.md#meaningful-documentation

Keep course points while a borrowed fork owns its entire initial plane.

## @evidence contracts/development/design.md#principled-representation `axis`: Continuous ridge axis in calibration millimetres, evaluated in the original ear frame. `coordinates`: Ridge-owned mapping from its axis stations to the auricular source coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadEarRidgeAxis.IOfResult is the canonical exchange used by AutoMovieHumanHeadEarRidgeAxis.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `axis`, `coordinates`; callers supply the complete record.
