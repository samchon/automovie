# src/human/generation/IAutoMovieHumanOralCavitySection.ts#IAutoMovieHumanOralCavitySection

## @evidence contracts/development/common.md#meaningful-documentation

One coronal section of the cavity's lining, an ellipse about a centre.

## @evidence contracts/development/design.md#principled-representation `x`: Forward place of the section at the midline. `y`: Height of its centre. `width`: Half width.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMouth.sweepAt. Also types AutoMovieHumanMouth.vestibule, AutoMovieHumanMouth.molars.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `x`, `y`, `width`, `up`, `down`, `sweep`; callers supply the complete record.
