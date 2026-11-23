# src/human/generation/hand/IAutoMovieHumanPalmPalmarSector.ts#IAutoMovieHumanPalmPalmarSector.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A sector's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `sides`: The two side guides' places in the section, `[b, c]`, mm, the thumb side first. `bone`: The palm's palmar bone line's `c` at the middle, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanPalmPalmarSector.arc.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `sides`, `bone`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanPalmPalmarSector.ts#IAutoMovieHumanPalmPalmarSector.ArcResult

## @evidence contracts/development/common.md#meaningful-documentation

Points of the sector's arc from the first side guide to the second, a half ellipse through the pad's deepest point.

## @evidence contracts/development/design.md#principled-representation

Points of the sector's arc from the first side guide to the second, a half ellipse through the pad's deepest point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanPalmPalmarSector.ArcResult is the canonical exchange used by AutoMovieHumanPalmPalmarSector.arc.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanPalmPalmarSector.arc for points of the sector's arc from the first side guide to the second, a half ellipse through the pad's deepest point.
