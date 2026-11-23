# src/math/decomposeAutoMovieSingularMatrix.ts#decomposeAutoMovieSingularMatrix

## @evidence contracts/development/implementation.md#principled-implementation

Jacobi rotations orthogonalize columns of the original scaled design and accumulate its right basis, avoiding condition squaring. A reported floating null cutoff excludes unresolvable tiny columns from convergence tests without erasing their computed norms; nonconvergence, unrepresentable factors or excessive measured reconstruction error throws.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounded factorization supplies least-squares and homogeneous right-null directions; admission, rotations and final measured reconstruction stay in this numerical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normal-matrix eigensolver, rank-restoring ridge, fixture branch or nonconverged fallback is used. The caller selects work and orthogonality budgets, while numerical-null limitations remain explicit.

## @evidence contracts/development/common.md#meaningful-documentation

Defines row input and column output, original units, maximum-entry scaling, numerical-null limits, LAPACK's method basis and every throwing condition.

## @evidence contracts/development/implementation.md#efficient-algorithms

For m rows, n columns and s sweeps, pair rotations cost O(s*m*n^2+s*n^3), and measured reconstruction costs O(m*n^2). Entry and sweep budgets bound dense work before allocation; this small-design kernel is not a large-matrix driver.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each pair's dot products determine both data and right-basis rotations; the final columns supply singular norms and reconstruction without another decomposition. Borrowed mutable input prevents cross-call reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All O(m*n+n^2) arrays are call-local and the returned factors transfer to the caller. Admission precedes allocation; throwing retains no cache, process or external handle.
