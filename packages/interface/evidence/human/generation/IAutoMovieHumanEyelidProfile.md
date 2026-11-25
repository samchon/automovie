# src/human/generation/IAutoMovieHumanEyelidProfile.ts#IAutoMovieHumanEyelidProfile.IGenerateSkin

## @evidence contracts/development/common.md#meaningful-documentation

One column of the lid band, outer edge excluded: anterior surface, rounded anterior edge, margin face, posterior edge and tuck.

## @evidence contracts/development/design.md#principled-representation `x`: Skin depth from the globe centre at the lid band's outer edge, millimetres. `k`: Derivative of skin depth per millimetre outward at that band edge.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEyelidProfile.IGenerateSkin is the canonical exchange used by AutoMovieHumanEyelidProfile.generate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `x`, `k`; callers supply the complete record.
