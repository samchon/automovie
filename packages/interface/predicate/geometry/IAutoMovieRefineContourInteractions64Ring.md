# src/geometry/IAutoMovieRefineContourInteractions64Ring.ts#IAutoMovieRefineContourInteractions64Ring

## @evidence contracts/development/common.md#meaningful-documentation

The work view describes an admitted finite planar boundary, its identity and its oriented mutable samples.

## @evidence contracts/development/design.md#principled-representation

The owner registers new source knots and splices their points into the same cyclic array, reversing insertion order for negative authored winding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This view carries only the data the interaction refinement shares. Source coefficients and lookup remain supplied separately.

# src/geometry/IAutoMovieRefineContourInteractions64Ring.ts#IAutoMovieRefineContourInteractions64Ring.id

## @evidence contracts/development/common.md#meaningful-documentation

The stable ring identity is used when reporting local contacts and retained refinement.

# src/geometry/IAutoMovieRefineContourInteractions64Ring.ts#IAutoMovieRefineContourInteractions64Ring.points

## @evidence contracts/development/common.md#meaningful-documentation

The existing sample array is spliced in place with source-registered millimetre knots.

# src/geometry/IAutoMovieRefineContourInteractions64Ring.ts#IAutoMovieRefineContourInteractions64Ring.winding

## @evidence contracts/development/common.md#meaningful-documentation

The authored sign selects the order of newly inserted points.
