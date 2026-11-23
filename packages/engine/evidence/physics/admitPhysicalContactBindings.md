# src/physics/admitPhysicalContactBindings.ts#admitPhysicalContactBindings

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Both relationship populations share identities, residual rows and articulated coordinate budgets before solver allocation) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Both relationship populations share identities, residual rows and articulated coordinate budgets before solver allocation) directly over its typed inputs (`input`, `body`, `bindings`, `pointBounds`) as nested iteration of depth 3 (for-of over bindings ?? []; find over input.bodies; find over body.profile.segments .find( ), delegating to `Array.isArray`, `allowance`, `ids.has`, `Number.isFinite`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (6 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 16, 32, 4, 3, 1024, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 194 lines and 14 top-level statements that reuses `Array.isArray`, `allowance`, `ids.has`, `Number.isFinite`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 16, 32, 4, 3, 1024 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`, `body`, `bindings`, `pointBounds`; the dominant cost is nested iteration of depth 3 (for-of over bindings ?? []; find over input.bodies; find over body.profile.segments .find( ), performed once per call with 23 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 23 allocation sites become the returned value or die with the call, so nothing grows.
