# src/physics/admitPhysicalMotionFrame.ts#admitPhysicalMotionFrame

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Refuse invalid consumer frames before geometry, speed and angular comparisons can hide a nonfinite measurement) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Refuse invalid consumer frames before geometry, speed and angular comparisons can hide a nonfinite measurement) directly over its typed inputs (`frame`, `bodies`, `seconds`) as nested iteration of depth 3 (for-of over bodies; for-of over [ ...motionAuditGeometry(body).seg; map over motionAuditGeometry(body).segments), delegating to `Number.isFinite`, `Math.abs`, `Math.max`, `motionAuditGeometry`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 64, 0.00001, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 50 lines and 2 top-level statements that reuses `Number.isFinite`, `Math.abs`, `Math.max`, `motionAuditGeometry`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 64, 0.00001 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `frame`, `bodies`, `seconds`; the dominant cost is nested iteration of depth 3 (for-of over bodies; for-of over [ ...motionAuditGeometry(body).seg; map over motionAuditGeometry(body).segments), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
