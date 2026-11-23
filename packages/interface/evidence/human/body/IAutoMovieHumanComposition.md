# src/human/body/IAutoMovieHumanComposition.ts#IAutoMovieHumanComposition

## @evidence contracts/development/common.md#meaningful-documentation

Fat and lean mass as two quantities.

## @evidence contracts/development/design.md#principled-representation `bodyFatPercentage`: Whole-body fat mass over body mass, percent. `appendicularLeanMassIndex`: Appendicular lean mass index: lean mass of the arms and legs over stature squared, kilograms per square metre. `subcutaneousFat`: Subcutaneous fat thickness over each region, the fat that decides how sharply muscle shows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanComposition is the canonical exchange used by IAutoMovieHumanCompositionSchema, IAutoMovieHumanIdentity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bodyFatPercentage`, `appendicularLeanMassIndex`, `subcutaneousFat`; callers supply the complete record.
