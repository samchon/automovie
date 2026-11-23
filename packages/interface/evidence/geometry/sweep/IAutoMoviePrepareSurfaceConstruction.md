# src/geometry/sweep/IAutoMoviePrepareSurfaceConstruction.ts#IAutoMoviePrepareSurfaceConstruction

## @evidence contracts/development/common.md#meaningful-documentation

Observation counts and named rig resolvers register a one-use snapshot of the actual metre construction field. Absent sample counts allocate no observations; observation registration neither changes registry sampling cells nor substitutes a display spline.

## @evidence contracts/development/design.md#principled-representation

Observation counts and named rig resolvers register a one-use snapshot of the actual metre construction field.

## @evidence contracts/development/design.md#minimal-and-owned-surface

prepareAutoMovieSurfaceConstruction shares live sweep and curve rigs with network patch construction, then reads after rest/girth evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent sample counts allocate no observations; observation registration neither changes registry sampling cells nor substitutes a display spline.

# src/geometry/sweep/IAutoMoviePrepareSurfaceConstruction.ts#IAutoMoviePrepareSurfaceConstruction.IProps

## @evidence contracts/development/design.md#principled-representation

Observation counts select metre polylines from the network's compiled rig; the preparer checks all count keys and minimums before registering points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork provides its own sweep and curve resolvers, so observations read the same rest field after girth solving rather than compiling a parallel display model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Observation slots do not enter the cage registry or change its sampling cells; absent counts request no snapshot.

## @evidence contracts/development/common.md#meaningful-documentation

Gives unsealed registration and finalized read ordering, callback retention and errors, count admission and snapshot ownership.
