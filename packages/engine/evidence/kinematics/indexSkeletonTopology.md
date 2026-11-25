# src/kinematics/indexSkeletonTopology.ts#indexSkeletonTopology

## @evidence contracts/development/implementation.md#principled-implementation

The children-only projection uses the same duplicate admission and parent grouping, without performing a root traversal. An adjacency list keyed by parent followed by a depth-first root walk; unique names are checked before grouping, so each bone has one parent and a cycle has no root from which it could recurse. The reachable set therefore matches the forward-kinematics traversal without ambiguous repeated identities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the pose-independent part of forward kinematics once so `resolvePose` and `reachableBoneNames` share it; the root sentinel comes from the shared `SKELETON_ROOT_PARENT` both read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bone is filed by its declared parent alone; an orphan or cycle is left unreachable rather than reattached or rejected, and no bone name is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass to group the bones and one walk over the reachable ones, linear in the bone count in time and space; the walk recurses to the skeleton's depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Produces the reusable index itself: callers pass it to `resolvePose` and `reachableBoneNames` across poses, and equivalence is the unchanged skeleton object, which the snapshot note makes the caller's responsibility.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned index is owned by the caller and holds one entry per bone plus one set entry per reachable bone, bounded by the skeleton's bone count; nothing is retained here.

## @evidence contracts/development/common.md#meaningful-documentation

States what each map holds and in which order, the root key, which bones are unreachable and why, and that the index is a snapshot the caller rebuilds after changing the skeleton.
