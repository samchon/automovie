# src/scene/createAutoMoviePhysicalPoseAdapter.ts#createAutoMoviePhysicalPoseAdapter

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Apply solved world bone frames to an existing complete skin rig, retaining unlisted bones' authored local transforms) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Apply solved world bone frames to an existing complete skin rig, retaining unlisted bones' authored local transforms) directly over its typed inputs (`model`) as nested iteration of depth 3 (map over [...bones]; for-of over Object.entries(poses); every over [ pose.position.x, p), delegating to `owned.has`, `ordered.push`, `owned.get`, `skins.push`, `skeletons.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 0.00001, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 106 lines and 11 top-level statements that reuses `owned.has`, `ordered.push`, `owned.get`, `skins.push`, `skeletons.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `model`; the dominant cost is nested iteration of depth 3 (map over [...bones]; for-of over Object.entries(poses); every over [ pose.position.x, p), performed once per call with 17 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 17 allocation sites become the returned value or die with the call, so nothing grows.
