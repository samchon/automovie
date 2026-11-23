# src/film/propSpaceContainsBounds.ts#propSpaceContainsBounds

## @evidence contracts/development/implementation.md#principled-implementation

Tests corners against the union of subtree volumes through shared containment. In exact geometry, corner inclusion implies box inclusion when that combined union is convex; convex individual cells or children do not make their union convex, so gaps and notches between accepted corners can remain unseen.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The undeclared-id refusal, the subtree fold, the stated-volume test and the per-space containment are the shared architecture queries; this function only applies them to a box's corners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No space or prop is special-cased; the semantic-container answer follows from the stated-volume test for every space alike rather than from a name.

## @evidence contracts/development/common.md#meaningful-documentation

States the corner rule, that corners may fall in different child spaces, the non-convex limitation, the unlocated subtree answer and why, the thrown error, its callers, and each parameter's meaning and units.

## @evidence contracts/development/implementation.md#efficient-algorithms

The subtree is walked once, linear in the space count, and each of the eight corners is tested against only the subtree's spaces, stopping at the first corner outside, instead of rebuilding the subtree for every corner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The validated root, the subtree and its space list are resolved once per call and shared by all eight corner tests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The subtree set and space list are dropped on return and nothing is retained.
