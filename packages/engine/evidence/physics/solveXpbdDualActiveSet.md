# src/physics/solveXpbdDualActiveSet.ts#solveXpbdDualActiveSet

## @evidence contracts/development/implementation.md#principled-implementation

Goldfarb and Idnani 1983: dual feasible start, most-violated (or preferred) row added by full or partial steps, J and R kept by Givens rotations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Initialize, add the equalities, then add violated inequalities until none is left.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Infeasibility and a reached bound return null for the caller's fallback; nothing is clamped or relabelled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each add or drop is O(n^2) on dense n x n arrays; the rounds are bounded by ten times the rows.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The rows change every call; only the preferred set carries over, through the caller.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates its arrays per call and returns fresh ones.

## @evidence contracts/development/common.md#meaningful-documentation

States the problem form, the method, its factorization, the treatment of equalities and the warm start.
