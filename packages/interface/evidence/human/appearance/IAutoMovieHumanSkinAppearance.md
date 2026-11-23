# src/human/appearance/IAutoMovieHumanSkinAppearance.ts#IAutoMovieHumanSkinAppearance

## @evidence contracts/development/common.md#meaningful-documentation

Skin surface finish on top of the identity's pigmentation.

## @evidence contracts/development/design.md#principled-representation `oiliness`: Surface oil, from dry (0) to oily (1), dimensionless, after the oiliness parameter of Donner and Jensen (2006, Eurographics Symposium on Rendering). `wrinkles`: Requested depth of fine surface wrinkles, from the faint lines of young skin (0) to the deep furrows of old, sun-exposed skin (1), dimensionless. `seed`: Stable unsigned 32-bit seed for surface marks; omitted, zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSkinAppearance is the canonical exchange used by IAutoMovieHumanSkinAppearanceSchema, IAutoMovieHumanAppearance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `seed`: Stable unsigned 32-bit seed for surface marks; omitted, zero. `freckles`: Freckle pigment marks; omitted or zero density/contrast requests no marks. `moles`: Moles and beauty marks; omitted or zero count/contrast requests none. `acne`: Inflamed spot appearance and shallow papule relief; omitted or zero density/severity requests none.
