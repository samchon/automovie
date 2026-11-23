# src/scene/inspection/findAutoMovieCollisionWitness.ts#findAutoMovieCollisionWitness

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the search and when absence of a witness proves clearance.

## @evidence contracts/development/implementation.md#principled-implementation

Signed distance to an exact solid by the Engine query, or to a closed drawn surface by its nearest triangle and generalized winding number; edges by a convex bracketing search or the spans between triangle crossings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search per direction, vertices before edges, sharing one solid reader and one allowance law.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Clearance needs both directions searched completely; a missing solid or surface leaves the search incomplete.

## @evidence contracts/development/implementation.md#efficient-algorithms

Points outside the other solid's bounds skip its distance; comparison and triangle work count against the frame's limits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Posed surfaces, solids and edge lists are memoized for the frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after the call beyond the caller's memo.
