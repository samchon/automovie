# src/human/appearance/IAutoMovieHumanPigmentation.ts#IAutoMovieHumanPigmentation

## @evidence contracts/development/common.md#meaningful-documentation

Constitutive skin pigmentation and iris colour.

## @evidence contracts/development/design.md#principled-representation `melanin`: Epidermal melanin volume fraction, dimensionless. `eumelaninShare`: Share of eumelanin in the epidermal melanin, the rest being pheomelanin, dimensionless. `haemoglobin`: Dermal haemoglobin volume fraction, dimensionless; the model range of Donner and Jensen is about 0.001 to 0.1 and site maxima reach about 0.3.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanPigmentation is the canonical exchange used by IAutoMovieHumanPigmentationSchema, IAutoMovieHumanIdentity, IAutoMovieHumanParameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `melanin`, `eumelaninShare`, `haemoglobin`, `iris`; callers supply the complete record.
