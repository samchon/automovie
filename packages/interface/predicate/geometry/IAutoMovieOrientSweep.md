# src/geometry/IAutoMovieOrientSweep.ts#IAutoMovieOrientSweep.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Live spine transport and normalized station layout for reusable section-plane orientation.

## @evidence contracts/development/design.md#principled-representation

The orientation wraps the carried transport and computes each station's relative turn from its current absolute quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller retains and refreshes the shared transport. The section compiler owns its packed per-station rotation buffers.

# src/geometry/IAutoMovieOrientSweep.ts#IAutoMovieOrientSweep.IProps.transport

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed frame-bearing transport retained by the orientation. Update it before refreshing station turns.

# src/geometry/IAutoMovieOrientSweep.ts#IAutoMovieOrientSweep.IProps.knots

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed nonempty finite increasing normalized station buffer. Its length fixes rotation storage at construction. Preserve station order.

# src/geometry/IAutoMovieOrientSweep.ts#IAutoMovieOrientSweep.IProps.fixed

## @evidence contracts/development/common.md#meaningful-documentation

True carries the initial transport axes at every spine point. False uses the moving transported axes. Station turns apply in either case.
