# src/internal/factorRecoveryMapDesign.ts#factorRecoveryMapDesign

## @evidence contracts/development/implementation.md#principled-implementation

The unchanged positive column scales, tall-design Givens compression and original-design SVD measure undamped rank; row order, sweeps and orthogonality tolerance are preserved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Full LS solving and rank-only metric consumption share original factorization, with no dummy step or gradient.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No Gram matrix, pivot floor, damped rank or unconverged SVD provides qualification; invalid rows/right and nonrepresentable QR/SVD propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Returned rows and factors use normalized columns; short designs alias their original right while tall designs own the compressed right. Callers release the whole record before unrelated scalable phases when they only need its ratio.

## @evidence contracts/development/implementation.md#efficient-algorithms

Tall compression costs O(m*C^2), square rank SVD O(S*C^3), with O(m*C+C^2) admitted storage. No gradient or LS step is synthesized.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ordinary solver reuses these exact arrays for its requested step. Metric-only construction immediately consumes the ratio instead of solving an unused LS problem.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owned rows/scales/SVD arrays transfer for one operation; solveRows can alias rows and short solveRight borrows input. No cache or external resource remains.
