# src/recovery/IAutoMovieRecoveryCameraMapRefinementOperation.ts#IAutoMovieRecoveryCameraMapRefinementOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation describes fixed observations and gauge, the two refinement paths, and how optional callbacks and report capacity enter the solve.

## @evidence contracts/development/design.md#principled-representation

Ordinary and feasible solvers preserve the initial observation population while updating pose and point parameters in a gauge-fixed chart. The rank, depth and residual qualifications use the supplied pixel charts and declared numerical limits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The solve returns candidate state and fit report. The enclosing map or scene transaction decides whether to publish the candidate, while the optional work callback is the caller's accounting owner.
