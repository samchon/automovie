# src/geometry/construction/legalizeAutoMovieSolidMesh.ts#legalizeAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Lawson's flip algorithm reaches the constrained Delaunay triangulation by exact lifted in-circle and orientation signs on one scaled chart that carries the length unit; the planner's own representability rules admit each flip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One index-only pass follows interior insertion; the planner keeps visibility and coverage, the in-circle predicate its arithmetic and the grid its metric.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moves no point, removes no vertex and flips no source constraint; an inconsistent incidence or a flip count past Lawson's bound is a named failure, never a partial result.

## @evidence contracts/development/common.md#meaningful-documentation

States why rail ears survive insertion, why their diagonals flip, the metric and its exactness, termination, fixed constraints, admission and visiting order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One adjacency map and a work queue; each in-circle test is constant work, and at most `n (n - 1) / 2` flips each queue four sides.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the planner's indexed positions and split constraints; no surface jet is evaluated and no point constructed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adjacency, pair counts and the queue are call-local O(T) storage; returned triangle triples are fresh and caller-owned.
