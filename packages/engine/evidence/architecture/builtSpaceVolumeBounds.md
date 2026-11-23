# src/architecture/builtSpaceVolumeBounds.ts#builtSpaceVolumeBounds

## @evidence contracts/development/implementation.md#principled-implementation

The box of a polyhedron is the box of its vertices: a shell's listed vertices, or the corners `builtConvexCellVertices` cuts from each convex cell's half-spaces, folded by `builtPointBounds`; an unbounded cell has no complete corner set, a limitation the documentation states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per volume spelling feeding the shared point fold, so the bounds of either spelling come from the same arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space; a space with no corners answers null rather than an invented origin box.

## @evidence contracts/development/common.md#meaningful-documentation

States both spellings, the null cases, the frame and unit, that unused shell vertices count, and that an unbounded cell can understate the extent.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V) for V shell vertices. For C cells, pays O(C) iteration plus each cell's O(N + P³(P + K)) enumeration for input planes N, retained planes P and corners K, then a linear fold over the combined corners. The fold allocates one box rather than one per point.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read of one space value per call that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the cut corner list only for the call; the caller owns the returned box.
