# src/physics/rerootPhysicalProfile.ts#rerootPhysicalProfile

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (The same articulated tree held from another segment: every joint on the path from the old root to the new one is inverted, so the new root is the fixed base of a fixed-pivot solve and the old root moves through the inverted joints) and documents parameters `profile`, `root`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (The same articulated tree held from another segment: every joint on the path from the old root to the new one is inverted, so the new root is the fixed base of a fixed-pivot solve and the old root moves through the inverted joints) directly over its typed inputs (`profile`, `root`) as nested iteration of depth 2 (map over profile.joints; some over profile.segments; for loop bounded by parentOf.has(bone)), delegating to `parentOf.has`, `parentOf.get`, `inverted.add`, `inverted.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 36 lines and 6 top-level statements that reuses `parentOf.has`, `parentOf.get`, `inverted.add`, `inverted.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `profile`, `root`; the dominant cost is nested iteration of depth 2 (map over profile.joints; some over profile.segments; for loop bounded by parentOf.has(bone)), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
