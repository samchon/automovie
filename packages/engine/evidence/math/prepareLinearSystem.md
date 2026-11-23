# src/math/prepareLinearSystem.ts#prepareLinearSystem

## @evidence contracts/development/implementation.md#principled-implementation

Both entries use partial-pivot Gaussian elimination. Preparation records matrix-only swaps/factors for exact replay on later copied right-hand sides; solve instead eliminates the actual augmented column immediately, before the same descending back substitution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

eliminate, largestEntry and backSubstitute own all numerical rules. The prepared closure serves repeated digit null-space columns, and solve serves AutoMovieSolidVector's ordinary one-shot workload without retained factors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both paths retain the largest-original-entry 1e-14 threshold, first-row-on-pivot-tie policy and exact row/back-subtraction order, with no regularization, approximate inverse, alternative rank decision or solution cache.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepared setup costs O(N^3) work/O(N^2) factors, then O(N^2) work/O(N) fresh storage per RHS. solve uses one O(N^2) augmented matrix and O(N^3) elimination without factor rows, pivot arrays or a solver closure.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated RHSs share only privately copied matrix factors, independent of source-array mutation or identity. The one-shot entry retains no preparation; both strategies share the same numerical owner and never cache a solution.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Prepared closures own O(N^2) coefficients/factors and O(N) pivots until caller release; each replayed column is local. One-shot augmented rows release on return/refusal. Only fresh O(N) solutions escape, with no global state or handles.

## @evidence contracts/development/common.md#meaningful-documentation

States finite square/scaled premises, strict pivot refusal, owned matrix snapshot and fresh RHS results; solve's child defines its one-shot augmented storage and caller ownership.
