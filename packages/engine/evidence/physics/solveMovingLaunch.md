# src/physics/solveMovingLaunch.ts#solveMovingLaunch

## @evidence contracts/development/implementation.md#principled-implementation

Iterate targetAt(t), solve a ballistic launch and replace t with its flight time, returning the closest visited residual unless it falls below 1e-6 seconds. Finite iteration is a fixed-point heuristic, not a guaranteed intercept or global optimum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner coordinates the target callback and solveBallisticLaunch without embedding trajectory integration or modifying the target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Default eight iterations and residual tolerance define exposed heuristic policy; an unreachable current iterate returns null even if an earlier candidate existed, and callback exceptions propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give callback time/position units, positive integer iteration limit, invalid-input null and approximate convergence scope.

## @evidence contracts/development/implementation.md#efficient-algorithms

I iterations make at most I analytic solves and callback evaluations after the initial estimate; only the best candidate and current time are retained.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The best visited candidate is retained within the call; target callbacks may be effectful, so evaluations and results are never memoized across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Iteration ends on convergence, exhaustion or failure; no callback reference, task or native resource is retained afterwards.
