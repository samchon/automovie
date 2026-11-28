# src/geometry/AutoMovieRecoveryChartMap.ts#AutoMovieRecoveryChartMap.parameterize

## @evidence contracts/development/common.md#meaningful-documentation

Supply source triangle indices, at least one unit-square anchor per connected component, a positive finite residual tolerance and a positive safe iteration cap for each coordinate. Invalid counts, indices, anchors or budgets throw before solving. A valid run may retain unqualified UV coordinates with an original-equation residual or failed triangle diagnostics.

## @evidence contracts/development/implementation.md#principled-implementation

Build positive neighboring weights and apply diagonal-preconditioned conjugate gradients to the Dirichlet system. Check actual oriented UV triangle area after solving because a connected anchored graph does not itself qualify map orientation. Chart surface fitting consumes the map report separately from residuals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse sparse adjacency and diagonal weights across both UV solves. Keep only the bounded iteration state and the mapped coordinates.
