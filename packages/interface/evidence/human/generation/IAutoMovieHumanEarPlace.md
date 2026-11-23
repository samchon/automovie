# src/human/generation/IAutoMovieHumanEarPlace.ts#IAutoMovieHumanEarPlace.AboveTragionOnLength

## @evidence contracts/development/common.md#meaningful-documentation

The line on the ear length, women and men, mm.

## @evidence contracts/development/design.md#principled-representation

The line on the ear length, women and men, mm. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEarPlace.AboveTragionOnLength is the canonical exchange used by AutoMovieHumanEarPlace.ABOVE_TRAGION_ON_LENGTH.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanEarPlace.ABOVE_TRAGION_ON_LENGTH for the line on the ear length, women and men, mm.

# src/human/generation/IAutoMovieHumanEarPlace.ts#IAutoMovieHumanEarPlace.IForward

## @evidence contracts/development/common.md#meaningful-documentation

The ear's fore-aft place at the tragion's height, forward of the skull's centre (the midpoint of the midline's front and back where they stand farthest apart) per head length: the rim's most anterior point and the mean of the rim's points.

## @evidence contracts/development/design.md#principled-representation `front`: Rim's most anterior position relative to the skull's centre; positive is forward. `centre`: Mean rim position relative to the skull's centre; positive is forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEarPlace.IForward is the canonical exchange used by AutoMovieHumanEarPlace.FORWARD.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `front`, `centre`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanEarPlace.ts#IAutoMovieHumanEarPlace.IForwardResult

## @evidence contracts/development/common.md#meaningful-documentation

The ear's fore-aft place at the tragion's height.

## @evidence contracts/development/design.md#principled-representation `front`: Rim's most anterior position relative to the skull's centre; positive is forward. `centre`: Mean rim position relative to the skull's centre; positive is forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEarPlace.IForwardResult is the canonical exchange used by AutoMovieHumanEarPlace.forward.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `front`, `centre`; callers supply the complete record.
