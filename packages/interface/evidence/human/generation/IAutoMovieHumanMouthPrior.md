# src/human/generation/IAutoMovieHumanMouthPrior.ts#IAutoMovieHumanMouthPrior.ITooth

## @evidence contracts/development/common.md#meaningful-documentation

One tooth's crown, millimetres.

## @evidence contracts/development/design.md#principled-representation `name`: Name within its quadrant. `width`: Mesiodistal crown width, along the arch. `depth`: Labiolingual or buccolingual crown depth, across the arch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMouthArch.arch, AutoMovieHumanMouthArch.place. Also types AutoMovieHumanMouthPrior.UPPER, AutoMovieHumanMouthPrior.LOWER.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `width`, `depth`, `height`, `neck`, `kind`; callers supply the complete record.
