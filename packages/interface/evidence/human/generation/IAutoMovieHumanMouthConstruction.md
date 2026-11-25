# src/human/generation/IAutoMovieHumanMouthConstruction.ts#IAutoMovieHumanMouthConstruction.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

What the head hands the mouth.

## @evidence contracts/development/design.md#principled-representation `stomion`: Height of the stomion. `width`: Half the mouth's width, midline to cheilion. `upper`: Upper vermilion height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMouth.create, AutoMovieHumanMouth.aperture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stomion`, `width`, `upper`, `lower`, `gap`, `subnasale`, `menton`, `sex`, `gonion`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanMouthConstruction.ts#IAutoMovieHumanMouthConstruction.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Mouth and the fissure cut into the skin.

## @evidence contracts/development/design.md#principled-representation `mouth`: The mouth. `aperture`: The slit along the contact line, cut by position like the nostrils.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanMouth.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `mouth`, `aperture`; callers supply the complete record.
