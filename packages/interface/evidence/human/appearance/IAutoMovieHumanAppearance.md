# src/human/appearance/IAutoMovieHumanAppearance.ts#IAutoMovieHumanAppearance

## @evidence contracts/development/common.md#meaningful-documentation

How a person looks on the surface beyond who they are: skin finish, scalp hair, brows, lashes and underwear.

## @evidence contracts/development/design.md#principled-representation `skin`: Skin surface finish. `hair`: Scalp hair. `browPair`: Eyebrows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanAppearance is the canonical exchange used by IAutoMovieHumanAppearanceSchema, IAutoMovieHumanParameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `skin`, `hair`, `browPair`, `lashPair`, `underwear`; callers supply the complete record.
