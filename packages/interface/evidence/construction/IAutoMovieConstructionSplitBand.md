# src/construction/IAutoMovieConstructionSplitBand.ts#IAutoMovieConstructionSplitBand.ISide

## @evidence contracts/development/design.md#principled-representation

A rail at one station with a station sign fixes the ribbon's chart direction `(into, 0)`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields are the whole side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The station is the realization's, not searched here.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit and sign meaning.

# src/construction/IAutoMovieConstructionSplitBand.ts#IAutoMovieConstructionSplitBand.IInput

## @evidence contracts/development/design.md#principled-representation

The host's arc, its end normal and the child's rail determine the loop and both ribbons.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The split's per-band slice of its declaration, in kernel units.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Realization owns valid sampling and arc inputs; create additionally refuses degenerate correspondence, ribbons or strip orientation rather than substituting a band.

## @evidence contracts/development/common.md#meaningful-documentation

States the arc's orientation, the normal's direction and the units.

# src/construction/IAutoMovieConstructionSplitBand.ts#IAutoMovieConstructionSplitBand.IBand

## @evidence contracts/development/design.md#principled-representation

Publishes the strip chain with the column data the body's cycles need, so the shared vertices are the columns' own points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the strip with the host arc phases needed by split realization to share its boundary vertices.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Column values are the ones the strip interpolates, not resampled.

## @evidence contracts/development/common.md#meaningful-documentation

States each array's indexing and unit.

# src/construction/IAutoMovieConstructionSplitBand.ts#IAutoMovieConstructionSplitBand.IStrip

## @evidence contracts/development/design.md#principled-representation

Publishes the strip chain with the column data the body's cycles need, so the shared vertices are the columns' own points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The chain, its surface and the column arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Column values are the ones the strip interpolates, not resampled.

## @evidence contracts/development/common.md#meaningful-documentation

States each array's indexing and unit.

# src/construction/IAutoMovieConstructionSplitBand.ts#IAutoMovieConstructionSplitBand.IStretch

## @evidence contracts/development/design.md#principled-representation

An arc is two host phases and a seam a built curve and the direction the loop reads it in; together they are every stretch a loop is made of.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A discriminated pair and its column count.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fan checks the first arc and sum of counts; positive integral counts and consistent fork geometry remain realization premises.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit and direction.

# src/construction/IAutoMovieConstructionSplitBand.ts#IAutoMovieConstructionSplitBand.IFanInput

## @evidence contracts/development/design.md#principled-representation

The loop's stretches, the host's and the child's sides and the corner turn determine the loop and both ribbons, as one arc and one seam do for a two-way split.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The split's per-band slice of its declaration, in kernel units.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fan checks initial-arc/count agreement and sampled geometry, while valid reach/window ranges remain the realizing caller's premise.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's role and unit.
