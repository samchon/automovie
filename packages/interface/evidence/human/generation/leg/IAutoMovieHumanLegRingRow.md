# src/human/generation/leg/IAutoMovieHumanLegRingRow.ts#IAutoMovieHumanLegRingRow

## @evidence contracts/development/common.md#meaningful-documentation

A ring's normalized guide shape and taut girth, with its canonical millimetre input contour. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IRow, OfRing declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IRow, OfRing separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanLegRingRow exchanges the named IRow, OfRing contracts with its Human callers. Interface owns these type declarations without importing that implementation.

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
