# src/math/createAutoMovieQuadraticFactor.ts#createAutoMovieQuadraticFactor

## @evidence contracts/development/implementation.md#principled-implementation

Sparse symmetric permutation and elimination-tree LDL factor the quasi-definite stabilized KKT. Signed 1e-8 static shifts and signed 2e-7 dynamic pivots below 1e-13 are confined to factors; up to ten corrections use the unchanged KKT residual, following the preceding Clarabel configuration and Davis's sparse LDL algorithm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The factor owns ordering, symbolic fill, numeric updates and original-system refinement; it knows no homogeneous scalars, caller geometry or termination status.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coefficient is thresholded or copied into a modified authored objective. Nonfinite factors or solves refuse, and finite factor output alone never becomes solved status.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the matrix, equality diagonal, reuse, factor-only stabilization, original-system refinement and finite-precision limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N=n+m and L actual factor nonzeros, storage is O(N+nnz(A)+L); symbolic work follows elimination paths, numeric work follows factor column intersections and each triangular solve costs O(N+L). No dense N-by-N array is created.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Permutation, elimination tree, column pointers and numeric/refinement workspaces serve all updates of one immutable sparse structure; changing only H requires numeric refactorization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned call-owned closure retains only its sparse structure and bounded work vectors; no cross-call factor, module, host handle or native instance is retained.
