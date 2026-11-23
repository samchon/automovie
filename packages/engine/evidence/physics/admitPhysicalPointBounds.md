# src/physics/admitPhysicalPointBounds.ts#admitPhysicalPointBounds

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Admit candidate-relative point intervals without inventing anatomy, axes or a goal point) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Admit candidate-relative point intervals without inventing anatomy, axes or a goal point) directly over its typed inputs (`profiles`, `body`, `bounds`, `ids`) as nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over bounds; some over reference?.segments), delegating to `Array.isArray`, `Object.hasOwn`, `ids.has`, `point`, `isPhysicalActuatorChain`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 256, 0.000001, 32, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 64 lines and 4 top-level statements that reuses `Array.isArray`, `Object.hasOwn`, `ids.has`, `point`, `isPhysicalActuatorChain` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 256, 0.000001, 32 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `profiles`, `body`, `bounds`, `ids`; the dominant cost is nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over bounds; some over reference?.segments), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
