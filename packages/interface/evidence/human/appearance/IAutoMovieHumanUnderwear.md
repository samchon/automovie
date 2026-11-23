# src/human/appearance/IAutoMovieHumanUnderwear.ts#IAutoMovieHumanUnderwear

## @evidence contracts/development/common.md#meaningful-documentation

Basic underwear, as a lower and an upper garment and one colour.

## @evidence contracts/development/design.md#principled-representation `bottom`: Lower garment. `top`: Upper garment. `color`: Garment colour as an sRGB hex `#RRGGBB`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanUnderwear is the canonical exchange used by IAutoMovieHumanUnderwearSchema, IAutoMovieHumanAppearance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bottom`, `top`, `color`; callers supply the complete record.
