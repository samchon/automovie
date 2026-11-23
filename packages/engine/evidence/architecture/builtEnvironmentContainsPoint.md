# src/architecture/builtEnvironmentContainsPoint.ts#builtEnvironmentContainsPoint

## @evidence contracts/development/implementation.md#principled-implementation

Containment in a union is containment in any member, so the answer is an existential test of the single-space predicate over the subtree the shared walk returns, stopping at the first space that holds the point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the shared subtree walk, the per-space predicate and the shared id refusal, so this query owns only the fold over descendants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space or caller; a subtree stating no volume contains nothing by the per-space rule rather than by a special case here.

## @evidence contracts/development/common.md#meaningful-documentation

States the world point, the descendant fold at any depth, that each space answers from its own stated volume, the empty answer for an unstated subtree, and the throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the space count for the walk and scan, plus the per-space containment cost for subtree members until the first hit; validation and placement checks call it per point, so the walk replaced a fixed-point rescan that grew with depth.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one point per call over the caller's mutable record; callers testing many points of one space recompute the subtree each time, a cost bounded by the space count.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The subtree set is dropped on return and nothing else is allocated beyond the predicate's own work.
