# src/physics/physicalShapeSurfaceAnchor.ts#physicalShapeSurfaceAnchor

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (A collider's exact support surface in a specified bone-local outward direction) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (A collider's exact support surface in a specified bone-local outward direction) directly over its typed inputs (`pose`, `shape`, `normal`) as a fixed number of statements with no loop or recursion in the body, delegating to `Quaternion.rotateVector`, `Vector3.normalize`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 39 lines and 6 top-level statements that reuses `Quaternion.rotateVector`, `Vector3.normalize`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `pose`, `shape`, `normal`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
