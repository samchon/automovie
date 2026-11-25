# src/geometry/sweep/IAutoMoviePrepareSurfaceConstruction.ts#IAutoMoviePrepareSurfaceConstruction.IProps

## @evidence contracts/development/design.md#principled-representation

Observation counts select metre polylines from the network's compiled rig; the preparer checks all count keys and minimums before registering points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork provides its own sweep and curve resolvers, so observations read the same rest field after girth solving rather than compiling a parallel display model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Observation slots do not enter the cage registry or change its sampling cells; absent counts request no snapshot.

## @evidence contracts/development/common.md#meaningful-documentation

Gives unsealed registration and finalized read ordering, callback retention and errors, count admission and snapshot ownership.
