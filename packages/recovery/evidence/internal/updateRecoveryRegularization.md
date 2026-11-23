# src/index.ts#updateRecoveryRegularization

## @evidence contracts/development/implementation.md#principled-implementation

For positive finite actual and predicted decreases, the computed ratio gives max(1/3,1-(2*rho-1)^3). The rho>=1 branch is algebraically identical and avoids cubic overflow. These finite checks qualify arithmetic use, not exact agreement or a Hessian approximation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This scalar owner returns the next coefficient and explicit support status; its caller owns the current design, actual increment, next-model timing and charging.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported decreases, ratio or coefficient preserve the previous damping without a specimen coefficient, floor, extra trial or refactor loop. Invalid previous damping is a core input error.

## @evidence contracts/development/common.md#meaningful-documentation

States the source, copied portion, computed ratio meaning and unchanged-coefficient failure effects; all published diagnostic values are finite or null.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar arithmetic and one fixed record need no scan or matrix; the fitting owner charges the original-design prediction separately before visiting it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The supplied actual and predicted decreases are consumed once without evaluating geometry or rebuilding a model.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One owned scalar record transfers; no design, state, callback or history is retained.
