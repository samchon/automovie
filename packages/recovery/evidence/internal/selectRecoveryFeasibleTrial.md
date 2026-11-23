# src/internal/selectRecoveryFeasibleTrial.ts#selectRecoveryFeasibleTrial

## @evidence contracts/development/implementation.md#principled-implementation

Same-base actual objective ordering selects only candidates passing every nonlinear gate, strict finite decrease and their own Armijo condition. Corrected full/half use the mixed path's derivative at zero and t*p+t^2*delta. A qualified baseline full bounds the selected cost, not its KKT progress or finite-trial rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner coordinates a bounded comparison and original baseline backtracking; it transfers the exact owned increment passed to the chosen retraction. Problem callbacks own geometry, and the fit owner independently checks original normal KKT after a commit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cost tie tolerance, failed-row deletion, repeated full trial, hidden exception, successful initial-state fallback or extra trial allowance supplies a result. Unsupported correction is candidate absence; unexpected callbacks and charge errors propagate even after a valid baseline was found.

## @evidence contracts/development/common.md#meaningful-documentation

Comparison has at most four evaluations, while all-full-failure baseline halving can use more within the passed remaining horizon. Qualified unselected candidates consume actual work and trials; only one selected state commits.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most remaining actual evaluations use O(n) increment construction plus owner geometry work. Fixed selection/attribution reserves256 visits per model and128+12*n per actual evaluation before execution; actual retraction, all gates, selected measurements and the single correction retain their separate owner charges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every comparison uses the same base, directions, metric and at most one correction. Half uses the existing corrected arc without a new factor, model or correction; baseline backtracking reuses its original direction.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller admits current/base/checkpoint ownership and four detached states beside factors and vectors. Best/mixed retain at most two additional width-vectors while the current increment is materialized. Only the chosen state and exact increment transfer; unselected candidate history expires.
