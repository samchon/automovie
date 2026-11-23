# src/human/generation/IAutoMovieHumanOralAnatomy.ts#IAutoMovieHumanOralAnatomy

## @evidence contracts/development/common.md#meaningful-documentation

One person's mouth.

## @evidence contracts/development/design.md#principled-representation `stomion`: Stomion's height. `width`: Half width, midline to cheilion. `upper`: Upper vermilion height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMouth.contactAt, AutoMovieHumanMouth.slitAt, AutoMovieHumanMouth.aperture. Also types AutoMovieHumanMouth.mouth.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stomion`, `width`, `upper`, `lower`, `subnasale`, `menton`, `contact`, `slit`, `front`, `teeth`, `edge`, `cant`, `vestibule`, `molars`, `oropharynx`, `pharynx`, `ridge`, `palate`, `tongue`; callers supply the complete record.
