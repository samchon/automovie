# src/human/body/IAutoMovieHumanSubcutaneousFat.ts#IAutoMovieHumanSubcutaneousFat

## @evidence contracts/development/common.md#meaningful-documentation

Thickness of the subcutaneous fat layer over each region of the body, millimetres, from the skin's underside to the deep fascia, measured uncompressed with the body at rest; both sides take the same values.

## @evidence contracts/development/design.md#principled-representation `abdomen`: Over the rectus abdominis, beside and below the navel. `flank`: Over the external oblique, above the iliac crest at the side. `chest`: Over the pectoralis major, above any breast.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSubcutaneousFat is the canonical exchange used by IAutoMovieHumanSubcutaneousFatSchema, IAutoMovieHumanComposition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `abdomen`, `flank`, `chest`, `back`, `upperArmFront`, `upperArmBack`, `forearm`, `thighFront`, `thighBack`, `calf`; callers supply the complete record.
