# src/human/generation/leg/IAutoMovieHumanLegRingRow.ts#IAutoMovieHumanLegRingRow.IRow

## @evidence contracts/development/common.md#meaningful-documentation

One ring as a row.

## @evidence contracts/development/design.md#principled-representation `shape`: The guides and fullness, in units of the girth over 2 pi. `girth`: The ring's taut girth, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegRingRow.of. Also types AutoMovieHumanLegSectionLaw.low, AutoMovieHumanLegSectionLaw.high.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `shape`, `girth`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegRingRow.ts#IAutoMovieHumanLegRingRow.OfRing

## @evidence contracts/development/common.md#meaningful-documentation

The row of a ring.

## @evidence contracts/development/design.md#principled-representation

The row of a ring. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegRingRow.OfRing is the canonical exchange used by AutoMovieHumanLegRingRow.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegRingRow.of for the row of a ring.
