# src/math/solveAutoMovieQuadraticProgram.ts#solveAutoMovieQuadraticProgram

## @evidence contracts/development/implementation.md#principled-implementation

Solves the admitted diagonal PSD objective through CSC assembly and the engine-owned TypeScript homogeneous interior-point kernel, then independently evaluates original row bounds and stationarity H*x+q+A-transpose*y with signed row duals; these residuals retain caller coefficient units and do not replace post-transform geometry checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The adapter joins admission, numerical solving and two original-problem residuals without changing solver statuses or choosing a caller-specific acceptance tolerance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Infeasible and incomplete statuses remain observable. The authored objective and bounds are unchanged: internal Ruiz equilibration is an invertible coordinate/objective scaling whose D/E/c factors are undone for diagnostics, while KKT stabilization affects numerical factors only and refinement measures the original system.

## @evidence contracts/development/common.md#meaningful-documentation

States PSD and sentinel limits, sparse admission, solved-status interpretation, residual ownership and the need to measure geometry after later transformations.

## @evidence contracts/development/implementation.md#efficient-algorithms

CSC assembly and residual reconstruction each cost O(n+m+nnz), with two doubles per gradient component and constant row scratch after the solve; every original row must be visited to detect maximum bound violation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Solves the current mutable input once and reconstructs its original residuals once; no cached status or gradient is shared across problems.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Assembled arrays and gradient are local and become unreachable on return; the result owns copied primal and dual arrays, and the engine kernel retains no reactor, factor or workspace across calls.
