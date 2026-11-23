# src/human/generation/IAutoMovieHumanHeadEyeOpening.ts#IAutoMovieHumanHeadEyeOpening

## @evidence contracts/development/common.md#meaningful-documentation

One eye's opening, calibration millimetres.

## @evidence contracts/development/design.md#principled-representation `place`: Distance of the fissure's centre from the midline. `length`: Length of the margin, endocanthion to exocanthion in 3D. `height`: Height of the margin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadEyeMargin.margin, canthi. Also types AutoMovieHumanHeadLandmarks.opening, AutoMovieHumanHeadEyeParts.eye.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `place`, `length`, `height`, `inner`, `span`, `seat`; callers supply the complete record.
