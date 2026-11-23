# src/composition/evaluateAutoMovieSchedule.ts#evaluateAutoMovieSchedule

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (The schedule at one instant, pure and seekable: the entries active then with their phase, and each subject's latest state snapshot from an entry already ended) and documents parameters `schedule`, `seconds`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (The schedule at one instant, pure and seekable: the entries active then with their phase, and each subject's latest state snapshot from an entry already ended) directly over its typed inputs (`schedule`, `seconds`) as 2 sequential passes (for-of over schedule.entries; for-of over ended), delegating to `active.push`, `ended.get`, `ended.set`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 26 lines and 6 top-level statements that reuses `active.push`, `ended.get`, `ended.set` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `schedule`, `seconds`; the dominant cost is 2 sequential passes (for-of over schedule.entries; for-of over ended), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
