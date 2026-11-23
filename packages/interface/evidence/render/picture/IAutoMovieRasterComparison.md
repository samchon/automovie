# src/render/picture/IAutoMovieRasterComparison.ts#IAutoMovieRasterComparison

## @evidence contracts/development/common.md#meaningful-documentation

Names the producing call; each member states its unit, range and what an unchanged pair yields.

## @evidence contracts/development/design.md#principled-representation

A reviewer needs the picture and a gate needs the count, so both come from one pass; the box says where to look and is null when nothing changed instead of an empty rectangle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members: the image a sheet takes, and the count, share, magnitude and place a comparison record takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pass or fail verdict is stored; the threshold belongs to the caller who knows what was meant to change.
