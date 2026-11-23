# src/human/generation/IAutoMovieHumanTrunkProfileFront.ts#IAutoMovieHumanTrunkProfileFront

## @evidence contracts/development/common.md#meaningful-documentation

Describes the front-midline height profile and its ordered millimetre landmark pairs; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

The front-midline height profile and its ordered millimetre landmark pairs. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanTrunkProfileFront; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing TrunkProfileFront contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanTrunkProfileFront.ts#IAutoMovieHumanTrunkProfileFront.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

The profile.

## @evidence contracts/development/design.md#principled-representation `at`: The forward place of the front midline at a height, mm. `marks`: The landmark stations the profile runs through, `[height, forward place]`, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkProfileFront.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `marks`; callers supply the complete record.
