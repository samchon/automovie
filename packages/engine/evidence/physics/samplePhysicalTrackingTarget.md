# src/physics/samplePhysicalTrackingTarget.ts#samplePhysicalTrackingTarget

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Resolve declared contact-triggered withdrawal from causal solver samples) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Resolve declared contact-triggered withdrawal from causal solver samples) directly over its typed inputs (`body`, `target`, `contacts`, `seconds`, `released`) as nested iteration of depth 2 (some over contacts; some over receipt.samples), delegating to `released.has`, `contacts.some`, `matches`, `released.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 47 lines and 4 top-level statements that reuses `released.has`, `contacts.some`, `matches`, `released.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `body`, `target`, `contacts`, `seconds`, `released`; the dominant cost is nested iteration of depth 2 (some over contacts; some over receipt.samples), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
