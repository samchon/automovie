# src/human/generation/IAutoMovieHumanMouthPrior.ts#IAutoMovieHumanMouthPrior

## @evidence contracts/development/common.md#meaningful-documentation

Describes tooth-crown dimensions and the closed vocabulary of crown forms; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Tooth-crown dimensions and the closed vocabulary of crown forms. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanMouthPrior; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing MouthPrior contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanMouthPrior.ts#IAutoMovieHumanMouthPrior.ITooth

## @evidence contracts/development/common.md#meaningful-documentation

One tooth's crown, millimetres.

## @evidence contracts/development/design.md#principled-representation `name`: Name within its quadrant. `width`: Mesiodistal crown width, along the arch. `depth`: Labiolingual or buccolingual crown depth, across the arch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMouthArch.arch, AutoMovieHumanMouthArch.place. Also types AutoMovieHumanMouthPrior.UPPER, AutoMovieHumanMouthPrior.LOWER.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `width`, `depth`, `height`, `neck`, `kind`; callers supply the complete record.
