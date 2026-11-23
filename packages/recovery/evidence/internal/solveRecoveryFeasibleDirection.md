# src/index.ts#solveRecoveryFeasibleDirection

## @evidence contracts/development/implementation.md#principled-implementation

The full simplex dual produces d=-sum(lambda*a), gamma=-min(a dot aggregate+offset). This is the same PSD pure-gamma QP as the existing numerical primitive, without extra auxiliary curvature. Strictly negative certified gamma gives objective descent and strict inward derivatives for active C1 constraints, not full nonlinear feasibility.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Recovery owns the objective/constraint interpretation and full original-row certificate; generic sparse convex minimization belongs to engine. Actual retraction, rank, gauge, point gates and nonlinear stationarity remain with the fitting owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No threshold relaxation, removed row, sampled constraint, abnormal-zero success or unbudgeted native solve supplies a direction. Iteration/work exhaustion remains uncertified. Stalled numerical qualification records actual-row failures separately from normalized-dual forward-error bounds and never supplies nonlinear convergence.

## @evidence contracts/development/common.md#meaningful-documentation

Defines row order, feasible offsets, metric coordinates and limited local inwardness. Actual returned-row residuals/qualification remain distinct from an outward-bounded normalized-dual reconstruction allowance. A stalled numerical certificate does not meet the requested sub-ulp gap or change nonlinear pixel/KKT tolerances.

## @evidence contracts/development/implementation.md#efficient-algorithms

With n coordinates, m rows and Z sparse coefficients, bounded pairwise minimization costs O(I*(n+m+Z)); complete certificate and forward-error scans cost O(n+m+Z), reserved as 256Z+1024m+128n+1024 visits, including fixed outward-neighbour work even for empty atoms. Its storage is O(n+m+Z) plus 128 reserved fixed slots, avoiding dense full-dimensional active factors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same immutable rows supply dual minimization and original-row checks. No fit, expected answer or previous geometry is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Budgeted local arrays expire or transfer as owned step/multipliers. No image, native reactor, callback history or external handle remains.
