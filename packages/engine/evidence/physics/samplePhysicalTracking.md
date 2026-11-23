# src/physics/samplePhysicalTracking.ts#samplePhysicalTracking

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Dense authored-relative joint errors at any cached film second, without retaining film-sized diagnostics) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Dense authored-relative joint errors at any cached film second, without retaining film-sized diagnostics) directly over its typed inputs (`input`, `cache`, `diagnostics`, `seconds`) as nested iteration of depth 2 (map over diagnostics .filter( (entr; filter over diagnostics; for-of over input.bodies), delegating to `cache.at`, `Math.floor`, `Math.ceil`, `diagnostics .filter`, `JSON.stringify`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 76 lines and 9 top-level statements that reuses `cache.at`, `Math.floor`, `Math.ceil`, `diagnostics .filter`, `JSON.stringify` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`, `cache`, `diagnostics`, `seconds`; the dominant cost is nested iteration of depth 2 (map over diagnostics .filter( (entr; filter over diagnostics; for-of over input.bodies), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
