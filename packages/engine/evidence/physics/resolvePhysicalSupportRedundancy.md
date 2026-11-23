# src/physics/resolvePhysicalSupportRedundancy.ts#resolvePhysicalSupportRedundancy

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Return a warm support seed's redundant coordinates to the authored posture) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Return a warm support seed's redundant coordinates to the authored posture) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.order; for-of over joint.axes; map over coordinates) plus a sort, delegating to `Number.isFinite`, `coordinates.push`, `coordinates.map`, `angle`, `projectPhysicalJointRotation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 190 lines and 27 top-level statements that reuses `Number.isFinite`, `coordinates.push`, `coordinates.map`, `angle`, `projectPhysicalJointRotation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 18 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.order; for-of over joint.axes; map over coordinates) plus a sort, performed once per call with 19 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 19 allocation sites become the returned value or die with the call, so nothing grows.
