# src/physics/assertPhysicalReturnPath.ts#assertPhysicalReturnPath

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Reject an obstructed C1 return before advancing native bodies) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Reject an obstructed C1 return before advancing native bodies) directly over its typed inputs (`input`, `bound`, `tick`, `phase`) as nested iteration of depth 4 (some over [...bound.handoffs.values()]; map over [...bound.segments]; map over [...segments]), delegating to `Object.keys`, `Object.fromEntries`, `rigid.isKinematic`, `rigid.nextTranslation`, `rigid.translation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (4 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 3, 64, 23, 4, 27, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 193 lines and 6 top-level statements that reuses `Object.keys`, `Object.fromEntries`, `rigid.isKinematic`, `rigid.nextTranslation`, `rigid.translation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 21 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`, `bound`, `tick`, `phase`; the dominant cost is nested iteration of depth 4 (some over [...bound.handoffs.values()]; map over [...bound.segments]; map over [...segments]), performed once per call with 12 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 12 allocation sites become the returned value or die with the call, so nothing grows.
