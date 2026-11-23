# src/film/skeletonRestFrames.ts#skeletonRestFrames

## @evidence contracts/development/implementation.md#principled-implementation

Composes each rest transform onto its parent's by quaternion rotation and multiplication, the forward-kinematics rule `resolvePose` applies at zero joint angles; the memo map makes each bone's frame depend only on its declared ancestors, and the in-progress set turns a parent cycle into an error rather than unbounded recursion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one rest-frame walk that `computeModelRestExtent` and `computeRestHeight` both read, so the drawn-geometry extent and the joint span cannot compose a bone differently; `resolvePose` is not reused because it drops unreachable bones where these measurements must refuse them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no rig or bone; every malformed-rig case throws with the bone path instead of being skipped, and nothing compensates for a measurement downstream.

## @evidence contracts/development/common.md#meaningful-documentation

States the composition formula, the unit-scale premise and why it holds, the frame and unit of the result, and each throwing case with its reason.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bone count B: one pass indexes names, and memoized recursion resolves each bone once, O(B) time and space; recursion depth is the deepest parent chain.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one skeleton; it memoizes within the call, and a caller measuring one rig repeatedly owns any cross-call reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds its name index and in-progress set only for the call; the returned map, one frame per bone, belongs to the caller.
