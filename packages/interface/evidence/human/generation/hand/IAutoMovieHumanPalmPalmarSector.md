# src/human/generation/hand/IAutoMovieHumanPalmPalmarSector.ts#IAutoMovieHumanPalmPalmarSector

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanPalmPalmarSector exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput, ArcResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanPalmPalmarSector; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput, ArcResult contracts and adds no alternate implementation, optional mode or runtime state.

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
