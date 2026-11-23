# src/random/philoxAutoMovie4x32.ts#philoxAutoMovie4x32

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (The Philox4x32-10 counter-based block function (Salmon, Moraes, Dror and Shaw, "Parallel random numbers: as easy as 1, 2, 3", SC 2011; the Random123 reference)) and documents parameters `counter`, `key`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (The Philox4x32-10 counter-based block function (Salmon, Moraes, Dror and Shaw, "Parallel random numbers: as easy as 1, 2, 3", SC 2011; the Random123 reference)) directly over its typed inputs (`counter`, `key`) as a single pass (for loop bounded by round < 10), delegating to `multiply`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 3, 10, 2654435769, 3144134277, 3528531795, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 20 lines and 5 top-level statements that reuses `multiply` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 3, 10, 2654435769, 3144134277, 3528531795 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `counter`, `key`; the dominant cost is a single pass (for loop bounded by round < 10), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
