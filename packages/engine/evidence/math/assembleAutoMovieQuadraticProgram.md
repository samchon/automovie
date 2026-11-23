# src/math/assembleAutoMovieQuadraticProgram.ts#assembleAutoMovieQuadraticProgram

## @evidence contracts/development/implementation.md#principled-implementation

The textbook two-pass transpose counts each column's entries, prefix-sums its pointers and scatters rows in ascending order through a per-column cursor; admission guarantees in-range unique indices, so the engine's conic assembly receives sorted CSC without collisions or gaps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission lives in `admitAutoMovieQuadraticProgram` because the displacement solvers, refinement and the garment fit must check a whole program they never assemble, and this function only adds the layout, which `solveAutoMovieQuadraticProgram` alone needs before calling the kernel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every row is laid out the same way and no coefficient is dropped, rescaled or merged, including exact zeros; the only substitution is a null endpoint becoming the kernel's documented unbounded sentinel.

## @evidence contracts/development/common.md#meaningful-documentation

States that admission runs first and throws, the column pointer layout and row order, that exact zeros stay, the sentinel for null endpoints, and which returned arrays are new and which are the caller's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in variables `n`, rows `m` and nonzeros `nnz`: two passes over the row entries plus one over the column counts, with column pointers and cursors of `n + 1` and `n` numbers, entry arrays of exactly `nnz` and endpoint arrays of `m`, and no per-entry or per-column temporary list.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call lays out the program it is given; the only caller solves it once and nothing is cached across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns its arrays to the caller and keeps no reference; the cursor array is released when the call returns.
