# src/human/generation/IAutoMovieHumanReferenceOutlines.ts#IAutoMovieHumanReferenceOutlines

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanReferenceOutlines exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IGlutealFootprint. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanReferenceOutlines; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IGlutealFootprint contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanReferenceOutlines.ts#IAutoMovieHumanReferenceOutlines.IGlutealFootprint

## @evidence contracts/development/common.md#meaningful-documentation

The gluteal mass's footprint about the buttock's most posterior point, women and men apart, as {@link BREAST_FOOTPRINT}: the wall's line runs from the gluteal fold to the back hull's first vertex toward iliocristale, the medial edge toward the cleft.

## @evidence contracts/development/design.md#principled-representation `female`: Observed gluteal-footprint summary for the retained female reference group. `male`: Observed gluteal-footprint summary for the retained male reference group.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanReferenceOutlines.IGlutealFootprint is the canonical exchange used by AutoMovieHumanReferenceOutlines.GLUTEAL_FOOTPRINT.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `female`, `male`; callers supply the complete record.
