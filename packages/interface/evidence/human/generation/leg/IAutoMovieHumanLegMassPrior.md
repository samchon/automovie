# src/human/generation/leg/IAutoMovieHumanLegMassPrior.ts#IAutoMovieHumanLegMassPrior.IRow

## @evidence contracts/development/common.md#meaningful-documentation

One row: the bin's centre as a share from the proximal joint, and the front share there.

## @evidence contracts/development/design.md#principled-representation `share`: Station share from the segment's proximal joint (hip or knee) to its distal one. `front`: Share of the section's depth ahead of the bone's line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegChain.rows, AutoMovieHumanLegMassPrior.THIGH.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `share`, `front`; callers supply the complete record.
