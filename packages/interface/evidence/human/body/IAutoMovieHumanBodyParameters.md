# src/human/body/IAutoMovieHumanBodyParameters.ts#IAutoMovieHumanBodyParameters

## @evidence contracts/development/common.md#meaningful-documentation

Primary body parameter record.

## @evidence contracts/development/design.md#principled-representation `anatomy`: Stature, tapes, segment lengths, skeletal breadths, landmark heights and fat percentage; each omitted measure takes its survey default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyParameters is the canonical exchange used by IAutoMovieHumanBodyParametersSchema, IAutoMovieHumanParameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `anatomy`; callers supply the complete record.
