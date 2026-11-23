# src/architecture/builtConvexCellVertices.ts#builtConvexCellVertices

## @evidence contracts/development/implementation.md#principled-implementation

Solves each plane triple by Cramer's rule in its cross-product form, `(b×c·d₁ + c×a·d₂ + a×b·d₃) / a·(b×c)`, then tests every half-space. Normalization gives admission distances in metres; the determinant is dimensionless and uses the same numeric epsilon as a separate near-parallel heuristic. Binary64 rounding, non-finite intermediates and skipped near-parallel triples can lose corners; enumeration does not certify boundedness.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One vertex enumeration that the observation stations and the space volume bounds read, returning bare points so each caller decides whether it needs a centroid, bounds or hull.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no cell or space; an unbounded or empty cell answers fewer or no points by the same rules rather than an invented box, and the tolerance is the shared observation constant.

## @evidence contracts/development/common.md#meaningful-documentation

States why cells are solved, the triple and admission rules, every tolerance use, the unbounded case, and the frame, unit and order of the points.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N input planes, P retained planes and at most K retained corners, O(N + P³(P + K)) time: normalization visits all inputs, and each triple can scan every retained plane and corner for admission and duplicate suppression. K is at most the number of retained triples; no measured advantage over a hull algorithm is asserted.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one cell that coordinates no work across calls; a caller reading one cell repeatedly owns any reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned points, at most one per plane triple.
