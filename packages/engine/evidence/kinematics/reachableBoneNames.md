# src/kinematics/reachableBoneNames.ts#reachableBoneNames

## @evidence contracts/development/implementation.md#principled-implementation

Reads the reachable set the topology's root walk already computed, the same walk `resolvePose` performs, so the two cannot disagree; it premises that a passed topology was built from this unchanged skeleton.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A named query over the shared topology index, used by retarget contact preservation and, through `fkReachableBones`, the physics validators, so none of them walks the hierarchy itself.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Detached bones are left out rather than reattached or rejected, and no bone or rig is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States what reachable means, that it matches `resolvePose` for every pose, why validators gate on it, the topology premise and default, and that the returned set is the caller's own copy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bone count: building the index when none is passed, then copying the reachable set so the caller's set cannot alias the shared index.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses a caller-supplied topology across calls for the same skeleton instead of rebuilding it; equivalence is the unchanged skeleton object, which the caller owns, and omitting the topology always rebuilds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned set, at most one entry per bone.
