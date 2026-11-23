# src/human/body/IAutoMovieHumanTraits.ts#IAutoMovieHumanTraits

## @evidence contracts/development/common.md#meaningful-documentation

A beginner's description of a person: sex, age, stature, reference population and build.

## @evidence contracts/development/design.md#principled-representation `sex`: Sex category associated with the requested reference statistics. `age`: Age in years, fractional for infants. `stature`: Stature in millimetres, or null for the reference population's median at the given sex and age.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTraits is the canonical exchange used by IAutoMovieHumanTraitsSchema.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `skinTone`: Skin pigmentation independent of population: 0 is pale (melanin fraction 0.013), 1 is dark (0.43), interpolated logarithmically.
