# src/physics/physicalIcpControllerQp.ts#physicalIcpControllerQp

## @evidence contracts/development/common.md#meaningful-documentation

States the program's variables, its 1/2 x^T H x - h^T x form, the frames and units of its terms, the double-counted dynamics task with its reference lines, and the null result on a failed solve.

## @evidence contracts/development/implementation.md#principled-implementation

A line-by-line port of IHMC's `ICPControllerQPSolver.compute` (develop, l.536-594) with its input calculator (l.35-206, l.216-280), constraint calculator (l.29-176) and `ConstraintToConvexRegion.formulateConstraint` (l.167-172), cited per block. The program is strictly convex because the CoP and CMP feedback weights are positive definite, so the cold-started dense dual active-set solve (`solveDenseActiveSet`) reaches the same unique minimizer as the reference's warm-started `JavaQuadProgSolver`. Degeneracies follow the reference: a zero direction gives a not-a-number row and a failed solve, a support of one or two vertices gives the point or line rows of `PolygonWiggler`, and an empty support adds no row. The pivot constraint is absent because Zulu's maximum CMP distance is not a number (`formulateCMPConstraint` l.705-727).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function assembles the costs in the reference's task order; the support, magnitude and rate rows are one file-private helper each, mirroring the reference's three constraint sources, and the small matrix helpers are file-private.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant is tuned: every weight and bound arrives from the caller. A magnitude row whose bound is infinite is left out; it holds for every x, so the minimizer is unchanged. There are no casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four variables and at most the support's vertex count plus eight rows; the cost is the hull and shrink of the support, linear-logarithmic in its vertices, and one dense solve over those rows.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpControllerQp.ts#physicalIcpControllerQp.IMatrix

## @evidence contracts/development/common.md#meaningful-documentation

Documents a 2 x 2 matrix stored row by row.

## @evidence contracts/development/design.md#principled-representation

A fixed-size tuple, so the type rules out matrices of another shape; its entries' units are those of the quantity it holds (gains are unitless, weights the program's).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the program; read by `physicalIcpController` for the gains, the CoP weight and the motion-frame transform.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpControllerQp.ts#physicalIcpControllerQp.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Documents every term with its frame, units and role, the rate weights' division by dt^2, the support's hull and empty case, and the infinite bounds that add no row.

## @evidence contracts/development/design.md#principled-representation

The terms `ICPController` hands the solver each update (l.353-416, l.420), in the caller's horizontal frame in metres. Finite weights and a positive definite CoP weight remain runtime conditions; a violated one fails the solve and gives null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Filled only by `physicalIcpController`; the magnitude and rate bounds are the reference's `setMaximumFeedbackMagnitude` and `setMaximumFeedbackRate` arguments, which the controller removes by passing infinite bounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members; removal of a bound is the reference's own infinite value.

# src/physics/physicalIcpControllerQp.ts#physicalIcpControllerQp.ISolution

## @evidence contracts/development/common.md#meaningful-documentation

Documents the two feedback terms in metres.

## @evidence contracts/development/design.md#principled-representation

The solution vector split at the reference's indices 0 and 2 (`copFeedbackIndex`, `cmpFeedbackIndex`); also the previous solution the rate tasks read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the program and read by `physicalIcpController`, which keeps it as its state's feedback pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.
