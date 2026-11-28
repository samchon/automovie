# src/fitting/AutoMovieRecoveryProfileFitting.ts#AutoMovieRecoveryProfileFitting.fitImageProfiles

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies the aligned pair of radius and centre rows, physical units, span and QR-ratio budget, and the refusal of nonpositive radius controls.

## @evidence contracts/development/implementation.md#principled-implementation

The shared scalar fit uses the same basis for all four fields. Positive radius controls imply a positive radius across each polynomial by the Bernstein convex-hull property. Mapping the four fitted rows into their owned fields preserves shared intervals and order.

## @evidence contracts/development/implementation.md#efficient-algorithms

The four rows share factorization and interval conversion. The final projection to named loft spans only visits the returned spans once and keeps no solver state.

# src/fitting/AutoMovieRecoveryProfileFitting.ts#AutoMovieRecoveryProfileFitting.fitScalarProfiles

## @evidence contracts/development/common.md#meaningful-documentation

The documentation describes equal-width finite millimetre rows, the first/last station chart, minimum row support, finite rank threshold and metre-valued outputs.

## @evidence contracts/development/implementation.md#principled-implementation

The clamped uniform spline basis is evaluated in the endpoint chart. Householder QR solves on the original design with all right-hand sides. Endpoint values and derivatives determine each equivalent cubic Bernstein span. The ratio of the smallest and largest QR diagonals is a rank threshold. It does not estimate a singular value.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sampled design serves all scalar fields and its per-column reflector applies to every remaining column and right-hand side. Matrix dimensions derive from admitted row and span counts. Only metre intervals, controls and the observed rank ratio leave the call.

# src/fitting/AutoMovieRecoveryProfileFitting.ts#AutoMovieRecoveryProfileFitting.selectScalarIntervals

## @evidence contracts/development/common.md#meaningful-documentation

The public contract states increasing millimetre levels, integer priority order, default full selection, positive overlap and the possibility of full slab extents outside the window.

## @evidence contracts/development/implementation.md#principled-implementation

Checking a complete integer permutation ensures each interval corresponds to one adjacent pair of saved levels. Its left endpoint must be below the window's upper bound and its right endpoint above the window's lower bound. Strict tests omit endpoint-only contact. Original endpoints remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

The selector validates every input level and priority once, then filters the supplied order and measures extents from retained intervals. The result contains only the saved indices, extents and exclusion count.
