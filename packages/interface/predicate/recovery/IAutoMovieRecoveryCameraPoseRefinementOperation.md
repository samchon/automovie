# src/recovery/IAutoMovieRecoveryCameraPoseRefinementOperation.ts#IAutoMovieRecoveryCameraPoseRefinementOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation states the five-parameter gauge, fixed observation population, objective units, and work and rank controls required for one fit.

## @evidence contracts/development/design.md#principled-representation

Three left-rotation coordinates and two translation-plane coordinates retain unit baseline. A column-scaled original Jacobian owns the rank diagnostic independently of damping.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This operation owns a candidate pose and the fixed-subset fit report. Consensus later checks whether the inlier population is stable.
