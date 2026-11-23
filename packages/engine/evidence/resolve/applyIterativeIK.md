# src/resolve/applyIterativeIK.ts#applyIterativeIK

## @evidence contracts/development/implementation.md#principled-implementation

Solve finite nondegenerate world-space chains by deterministic CCD or FABRIK, then write shortest-arc rotations and influence-blended positions under a positive safe-integer iteration budget; TRS decomposition remains a supported-input premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One world-driver owner handles solver choice, influence and descendant recomposition; iterative solvers ignore pole as their driver contract states, while analytic twoBone owns it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Degenerate directions use deterministic numerical fallbacks, not fixture goals; this solver does not apply anatomical ROM, and extreme overflow/deep recursion remain unsupported numerical/stack limits.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give chain/goal roles, metre residual threshold, fixed default budget and in-place world-map effects; partial mutation on later failure is not transactional rollback.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C chain nodes and I iterations, CCD can rotate suffixes in O(I*C*C), FABRIK uses O(I*C), plus descendant recomposition; snapshots and solver positions use O(C) temporary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read chain positions once per solve and reuse them during iteration; changed goals/world transforms require a fresh solve, with no persistent convergence cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns mutated world/local maps; iteration arrays and rotations are call-local, with no solver worker, native handle or future task retained.
