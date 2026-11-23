# src/human/skeleton/IAutoMovieHumanNeutralHip.ts#IAutoMovieHumanNeutralHip

## @evidence contracts/development/common.md#meaningful-documentation

Describes a hip's world rotation from bind and its clinical resting abduction in degrees; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

A hip's world rotation from bind and its clinical resting abduction in degrees. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanNeutralHip; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing NeutralHip contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/skeleton/IAutoMovieHumanNeutralHip.ts#IAutoMovieHumanNeutralHip.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

One hip's neutral.

## @evidence contracts/development/design.md#principled-representation `turn`: The thigh's world turn from the bind. `resting`: The abduction from the plumb line, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralHip.derive. Also types AutoMovieHumanNeutral.hip, AutoMovieHumanNeutralHip.plumb.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `turn`, `resting`; callers supply the complete record.
