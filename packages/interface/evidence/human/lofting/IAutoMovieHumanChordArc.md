# src/human/lofting/IAutoMovieHumanChordArc.ts#IAutoMovieHumanChordArc.IEnd

## @evidence contracts/development/common.md#meaningful-documentation

A guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`.

## @evidence contracts/development/design.md#principled-representation

A guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanChordArc.jet, AutoMovieHumanChordArc.published. Also types AutoMovieHumanLegRingRow.ends, AutoMovieHumanLegRingRow.b.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegRingRow.ends, AutoMovieHumanLegRingRow.fullness, AutoMovieHumanLegRingRow.b, AutoMovieHumanLegTube.ends for a guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`.

# src/human/lofting/IAutoMovieHumanChordArc.ts#IAutoMovieHumanChordArc.Jet

## @evidence contracts/development/common.md#meaningful-documentation

A point of the arc with its first and second derivatives in `xi`.

## @evidence contracts/development/design.md#principled-representation

A point of the arc with its first and second derivatives in `xi`. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanChordArc.jet. Also types AutoMovieHumanLegTube.[p, d1, d2], AutoMovieHumanChordArc.out.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegTube.sectors, AutoMovieHumanChordArc.jet, AutoMovieHumanChordArc.out for a point of the arc with its first and second derivatives in `xi`.
