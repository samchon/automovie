# src/human/generation/leg/IAutoMovieHumanLegCentreLine.ts#IAutoMovieHumanLegCentreLine.IAnchor

## @evidence contracts/development/common.md#meaningful-documentation

A centroid the line passes through.

## @evidence contracts/development/design.md#principled-representation `at`: Station, mm. `point`: The centroid in the canonical body frame, `[x, z]` mm (the ring's plane is horizontal).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegCentreLine.offset.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `point`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegCentreLine.ts#IAutoMovieHumanLegCentreLine.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the line is placed from.

## @evidence contracts/development/design.md#principled-representation `frames`: The leg's frames. `ankle`: The ankle ring's centroid at the leg's first station. `crotch`: The crotch arc's centroid at the leg's last station.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegCentreLine.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frames`, `ankle`, `crotch`, `knee`, `mass`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegCentreLine.ts#IAutoMovieHumanLegCentreLine.OfResult

## @evidence contracts/development/common.md#meaningful-documentation

The centre line.

## @evidence contracts/development/design.md#principled-representation

The centre line. The callable takes s and returns [number, number].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegCentreLine.OfResult is the canonical exchange used by AutoMovieHumanLegCentreLine.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegCentreLine.of for the centre line.
