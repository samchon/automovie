# src/geometry/IAutoMovieProjectionIntervals.ts#IAutoMovieProjectionIntervals

## @evidence contracts/development/common.md#meaningful-documentation

Outward projection enclosures along a stored direction relative to the supplied reference point.

## @evidence contracts/development/design.md#principled-representation

The projection operation scales the direction by its largest absolute component, then bounds differences, dot products and the scaled norm with outward binary64 arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result owns point-aligned intervals and a shared norm enclosure. Projection separation chooses its own axes and consumes gaps from these values.

# src/geometry/IAutoMovieProjectionIntervals.ts#IAutoMovieProjectionIntervals.intervals

## @evidence contracts/development/common.md#meaningful-documentation

One owned [low, high] interval per input point, in input order and relative to the reference origin. A zero direction yields [0, 0] for every admitted point.

# src/geometry/IAutoMovieProjectionIntervals.ts#IAutoMovieProjectionIntervals.normUpper

## @evidence contracts/development/common.md#meaningful-documentation

Upper enclosure of the scaled direction's Euclidean norm. A zero direction gives zero and supplies no positive separation proof.
