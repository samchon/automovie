# src/geometry/sweep/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IProps

## @evidence contracts/development/design.md#principled-representation

Packed targets and quad indices define a linear limit system in the caller's frame and length unit; the wrapper checks triple packing and stencil construction checks supported incidence, not coordinate finiteness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitAutoMovieSubdivisionLimit builds canonical stencils and delegates to solveAutoMovieSubdivisionLimit; callers supply optional held vertices without exposing solver buffers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Pinning fixes controls, not their limit points; convergence remains observable in the returned residual rather than assumed from valid topology.

## @evidence contracts/development/common.md#meaningful-documentation

Documents topology premises, input ownership, packing, mask defaults, units and solver stopping behavior.

# src/geometry/sweep/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IResult

## @evidence contracts/development/design.md#principled-representation

Positions retain the target frame and length unit; residual is a Euclidean length and the two fields do not encode a convergence guarantee.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one-shot fitter returns newly allocated controls and the residual needed to judge the fit; the stencil and ping-pong buffers remain private.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Iteration exhaustion is exposed through residual rather than hidden by a success boolean; the reported residual measures the returned controls even at the iteration cap.

## @evidence contracts/development/common.md#meaningful-documentation

States mutable output ownership, held-control meaning, residual units and the iteration-cap limitation.
