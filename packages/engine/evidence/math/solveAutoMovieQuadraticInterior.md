# src/math/solveAutoMovieQuadraticInterior.ts#solveAutoMovieQuadraticInterior

## @evidence contracts/development/implementation.md#principled-implementation

A homogeneous quadratic embedding, orthant predictor-corrector, cone-interior fraction-to-boundary steps and sparse refined KKT solves produce either original-coordinate KKT convergence or checked primal/dual infeasibility certificates. Status 1 requires the inherited 1e-9 gap/feasibility criteria; finite-iteration and reduced-accuracy results remain distinct.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner sequences initialization, measurements, factors, directions and status extraction; separate owners retain their equations and the public adapter retains independent original-row residuals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No objective ridge, relaxed constraint, small-coefficient deletion, fixture dispatch, last-iterate success or external fallback exists. Optional initial state is ignored consistently with the preceding cold solver.

## @evidence contracts/development/common.md#meaningful-documentation

States method/source, cone scope, deterministic host independence, workspace ownership, convergence/status meaning and physical acceptance limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 200 Newton iterations reuse one sparse symbolic factor; each adds one numeric factorization, three refined solves and O(n+m+nnz) vector/residual work. Storage follows actual sparse factor fill plus O(n+m+nnz) arrays rather than a dense variable square.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One iteration shares numeric factors and the constant RHS between both directions; each problem rebuilds from current immutable coefficients with no warm cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All factors, previous/current iterates and directions belong to this synchronous call; only copied primal/dual values and scalar diagnostics escape, and no instance or handle remains globally retained.
