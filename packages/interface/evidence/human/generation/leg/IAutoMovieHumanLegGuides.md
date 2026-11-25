# src/human/generation/leg/IAutoMovieHumanLegGuides.ts#IAutoMovieHumanLegGuides.IShape

## @evidence contracts/development/common.md#meaningful-documentation

The guides and the sectors of a section at one station.

## @evidence contracts/development/design.md#principled-representation `guides`: The eight guides by increasing angle. `fullness`: One fullness per guide: sector `j` follows guide `j`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegGuides.shape. Also types AutoMovieHumanLegTube.shape, AutoMovieHumanLegTube.own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `guides`, `fullness`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegGuides.ts#IAutoMovieHumanLegGuides.IEnd

## @evidence contracts/development/common.md#meaningful-documentation

A neighbour's ring read as the shape's row at its own station.

## @evidence contracts/development/design.md#principled-representation `at`: Station of the ring, mm. `shape`: The ring's guides and fullness, in units of its girth over 2 pi.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegGuides.row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `shape`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegGuides.ts#IAutoMovieHumanLegGuides.IEnds

## @evidence contracts/development/common.md#meaningful-documentation

The rings the shape ends on.

## @evidence contracts/development/design.md#principled-representation `bottom`: The foot's ankle ring. `top`: The trunk's crotch ring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegGuides.shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `bottom`: The foot's ankle ring. `top`: The trunk's crotch ring.

# src/human/generation/leg/IAutoMovieHumanLegGuides.ts#IAutoMovieHumanLegGuides.ShapeResult

## @evidence contracts/development/common.md#meaningful-documentation

The section's guides and fullness along the leg.

## @evidence contracts/development/design.md#principled-representation

The section's guides and fullness along the leg. The callable takes s and returns IShape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegGuides.ShapeResult is the canonical exchange used by AutoMovieHumanLegGuides.shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegGuides.shape for the section's guides and fullness along the leg.
