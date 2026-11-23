# src/geometry/sweep/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths

## @evidence contracts/development/common.md#meaningful-documentation

Named closed cage rings constrain rest perimeter in metres through live dimensionless sweep girth factors. Supported regular ring incidence is admitted by the solver; failure can leave the last evaluated trial in rigs and positions, with no whole-solve rollback.

## @evidence contracts/development/design.md#principled-representation

Named closed cage rings constrain rest perimeter in metres through live dimensionless sweep girth factors.

## @evidence contracts/development/design.md#minimal-and-owned-surface

holdAutoMovieSurfaceGirths uses the owning network's rig resolver and rest fitter against shared control storage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supported regular ring incidence is admitted by the solver; failure can leave the last evaluated trial in rigs and positions, with no whole-solve rollback.

# src/geometry/sweep/IAutoMovieHoldSurfaceGirths.ts#IAutoMovieHoldSurfaceGirths.IProps

## @evidence contracts/development/design.md#principled-representation

Cage indices identify regular closed rows; perimeter targets and packed controls share model metres while installed radial factors are dimensionless. The solver admits ring incidence and positive finite measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork lends its existing rigs and rest fitter to the girth solver, so the fit uses the same geometry and slot storage as later poses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed-position ring cannot also request perimeter, and unsupported rows are refused instead of measured using an unrelated polygon approximation.

## @evidence contracts/development/common.md#meaningful-documentation

States which buffers and rigs mutate, callback ordering, perimeter units and the supported topology.
