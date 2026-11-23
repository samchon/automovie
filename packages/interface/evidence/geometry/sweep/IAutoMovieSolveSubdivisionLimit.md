# src/geometry/sweep/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IProps

## @evidence contracts/development/design.md#principled-representation

Stencil count and indices address packed XYZ targets and a per-vertex free mask in one length unit. Buffer capacities, finite inputs and nonoverlap are unchecked caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitAutoMovieSubdivisionLimit and rigAutoMovieSurfaceNetwork supply their canonical stencils and buffers, allowing repeated poses to reuse allocation without reusing previous controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Held controls stay at targets and each solve starts from targets; the plain indexed buffer shape does not falsely enforce lengths or convergence.

## @evidence contracts/development/common.md#meaningful-documentation

States units, masks, aliasing requirements, mutation, scratch lifetime and residual stopping behavior.
