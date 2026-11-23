# src/geometry/curve/IAutoMoviePlanContourWalks64Ring.ts#IAutoMoviePlanContourWalks64Ring

## @evidence contracts/development/design.md#principled-representation

Identity keys select prepared walks independently of point coordinates; points use the common contour millimetre frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieContourWalks64 reads only id and points while its generic ring subtype preserves callback-owned source data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Equal coordinates do not merge ring identity; source-owner callbacks resolve inserted shared knots.

## @evidence contracts/development/common.md#meaningful-documentation

States stable IDs, mutable sample lifetime and the transition after preparation.
