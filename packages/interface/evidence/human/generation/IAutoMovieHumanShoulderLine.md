# src/human/generation/IAutoMovieHumanShoulderLine.ts#IAutoMovieHumanShoulderLine

## @evidence contracts/development/common.md#meaningful-documentation

Describes the shoulder outline point's vertical and lateral millimetre coordinates; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

The shoulder outline point's vertical and lateral millimetre coordinates. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanShoulderLine; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing ShoulderLine contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanShoulderLine.ts#IAutoMovieHumanShoulderLine.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

The shoulder point's place on the outline.

## @evidence contracts/development/design.md#principled-representation `y`: Height of the shoulder point, mm. `z`: Its lateral place, mm: half the biacromial breadth the course input fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanShoulderLine.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `y`, `z`; callers supply the complete record.
