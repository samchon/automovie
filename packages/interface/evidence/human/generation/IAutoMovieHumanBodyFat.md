# src/human/generation/IAutoMovieHumanBodyFat.ts#IAutoMovieHumanBodyFat.IMenNaturalWaist

## @evidence contracts/development/common.md#meaningful-documentation

Men's natural waist on omphalion waist and buttock circumference, mm: `natural = 106.84 + 0.7868 omphalion + 0.0554 buttock`, ANSUR 1988, R2 0.92 (`docs/sources/ansur-1988.md`).

## @evidence contracts/development/design.md#principled-representation `a`: Intercept of the table's affine predictor, in the response quantity's documented unit. `omphalion`: Coefficient on abdomen circumference at the omphalion in the natural-waist regression, millimetres per millimetre. `buttock`: Coefficient on buttock circumference in the natural-waist regression, millimetres per millimetre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyFat.IMenNaturalWaist is the canonical exchange used by AutoMovieHumanBodyFat.MEN_NATURAL_WAIST.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `a`, `omphalion`, `buttock`; callers supply the complete record.
