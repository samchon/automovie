# src/human/generation/IAutoMovieHumanBodyLaneInterim.ts#IAutoMovieHumanBodyLaneInterim.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the interim lane reads.

## @evidence contracts/development/design.md#principled-representation `solution`: The same canonical solved placement, including its actual neck owner. `params`: The public input. `scale`: Calibration millimetres per world millimetre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodyLaneInterim.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `solution`, `params`, `scale`, `stature`, `crotch`, `trunk`, `neckConnection`, `sources`, `frame`; callers supply the complete record.
