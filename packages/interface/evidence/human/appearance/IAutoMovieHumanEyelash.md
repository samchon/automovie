# src/human/appearance/IAutoMovieHumanEyelash.ts#IAutoMovieHumanEyelash

## @evidence contracts/development/common.md#meaningful-documentation

Eyelashes along the lid margins.

## @evidence contracts/development/design.md#principled-representation `color`: Lash colour. `length`: Length of the longest upper lash, millimetres; natural lashes rarely exceed 12 mm (Aumond and Bitton 2018, J Optom 11(4):211-222).

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEyelash is the canonical exchange used by IAutoMovieHumanEyelashSchema, IAutoMovieHumanAppearance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `color`, `length`; callers supply the complete record.
