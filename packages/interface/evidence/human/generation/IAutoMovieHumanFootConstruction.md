# src/human/generation/IAutoMovieHumanFootConstruction.ts#IAutoMovieHumanFootConstruction

## @evidence contracts/development/common.md#meaningful-documentation

Describes bilateral foot dimensions and the body-to-calibration scale consumed by construction; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Bilateral foot dimensions and the body-to-calibration scale consumed by construction. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanFootConstruction; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing FootConstruction contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanFootConstruction.ts#IAutoMovieHumanFootConstruction.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

What a foot reads.

## @evidence contracts/development/design.md#principled-representation `left`: Left foot. `right`: Right foot. `fat`: Fat control; the foot's form takes no published relation to it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLaw.footDimensions, feet. Read by AutoMovieHumanFootConstruction.add, AutoMovieHumanFootConstruction.bones.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `left`, `right`, `fat`, `muscularity`, `scale`; callers supply the complete record.
