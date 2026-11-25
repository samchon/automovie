# src/internal/RecoveryChartMap.ts#RecoveryChartMap.parameterize

## @evidence contracts/development/implementation.md#principled-implementation

Diagonally preconditioned conjugate gradients solve the symmetric free graph Laplacian with fixed-neighbor right-hand sides; all original equations and parameter triangles are checked after solving.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admitted adjacency graph serves anchoring, both coordinate solves and residual reconstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source position is a generating control, no missing anchor is guessed, and solver failure or a folded UV face remains unqualified without clipping or triangle reversal.

## @evidence contracts/development/common.md#meaningful-documentation

States anchoring, positive-definiteness premises, binary64 residuals and separate topological/fitting obligations.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V private vertices, E graph edges and I iterations per coordinate, admission is O(V+E), solving O(I(V+E)), and storage O(V+E); conditioning controls the required iteration count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One undirected adjacency and free-index registry are reused for u, v and independent original-equation residuals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adjacency and PCG arrays are local and released on return or refusal; only parameters and diagnostic witnesses escape to the private observation caller.
