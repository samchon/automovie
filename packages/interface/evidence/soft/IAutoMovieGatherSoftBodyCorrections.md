# src/soft/IAutoMovieGatherSoftBodyCorrections.ts#IAutoMovieGatherSoftBodyCorrections.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the stencil, simultaneous read/add lifecycle, metre displacements, zero/skipped cases and sole output buffer.

## @evidence contracts/development/design.md#principled-representation

P row-major particles require 3P coordinates, P masses/valences and 12P rest slots; numeric dimensions and compatible nonaliasing buffers remain runtime caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The core's preparation arrays directly serve gatherSoftBodyCorrections without per-sweep topology allocation or a separate solver state type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Three family weights are data rather than named special-case solvers; the request does not claim convergence or admission from a typed array alone.
