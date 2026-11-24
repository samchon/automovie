# src/physics/solveXpbdSupportCascade.ts#solveXpbdSupportCascade

## @evidence contracts/development/implementation.md#principled-implementation

Herzog et al. 2016, eq. 5, with the posture as a motion task; hierarchical least squares for infeasible holds; each level by Goldfarb and Idnani 1983 warm-started from the previous active set; the interior-point solve only when it reports no solution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the rows once, solve level one, fix its residual, solve level two; on an infeasible level one, the same with a hold level first.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed level is solved again cold, never accepted; bounds and coefficients are the rows'.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two dense active-set solves of O(n^2) per added or dropped row, three when the holds are relaxed; a warm solve whose active set did not change adds its rows once each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rows are built once for every level; the active sets carry over in the caller's warm store.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the warm store's two key lists; returns a fresh array.

## @evidence contracts/development/common.md#meaningful-documentation

States the levels, the feasible set, the objectives, the relaxed holds, the solver, its warm start and the fallback.
