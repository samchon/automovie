# src/geometry/IAutoMoviePreparedSurfaceFrame.ts#IAutoMoviePreparedSurfaceFrame

## @evidence contracts/development/design.md#principled-representation

Coordinates in an orthonormal source basis preserve the original triangle under a change to another orthonormal basis, up to binary64 rounding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains the source placement and three fixed offsets rather than retaining a mesh, skeleton or evaluator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No dimensions are guessed or snapped to a plane; the normal-coordinate residual is retained rather than discarded.

## @evidence contracts/development/common.md#meaningful-documentation

States the factory, frozen ownership, centroid basis, metre unit, point ordering and retained floating-point residual.
