# src/physics/samplePhysicalContactEvents.ts#samplePhysicalContactEvents

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Admit causal contact quantities and flatten completed solver samples without promoting geometry to impulse authority) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Admit causal contact quantities and flatten completed solver samples without promoting geometry to impulse authority) directly over its typed inputs (`receipt`, `seconds`) as nested iteration of depth 2 (every over [value.x, value.y, value.z]; every over [value.body, value.bone, value.shape, va; for-of over receipt.samples), delegating to `point`, `Math.abs`, `Math.hypot`, `name.trim`, `identity`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (6 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 0.00001, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 92 lines and 13 top-level statements that reuses `point`, `Math.abs`, `Math.hypot`, `name.trim`, `identity` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `receipt`, `seconds`; the dominant cost is nested iteration of depth 2 (every over [value.x, value.y, value.z]; every over [value.body, value.bone, value.shape, va; for-of over receipt.samples), performed once per call with 16 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 16 allocation sites become the returned value or die with the call, so nothing grows.
