# src/physics/admitPhysicalPlaybackMetadata.ts#admitPhysicalPlaybackMetadata

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Refuse malformed causal metadata even when an archive has a valid integrity trailer) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Refuse malformed causal metadata even when an archive has a valid integrity trailer) directly over its typed inputs (`header`) as nested iteration of depth 4 (map over header.segments; map over header.segments; every over [value.x, value.y, value.z]), delegating to `JSON.stringify`, `Number.isFinite`, `point`, `Math.abs`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (20 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 0.00001, 3, 1e-7, 1024, 64, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 267 lines and 17 top-level statements that reuses `JSON.stringify`, `Number.isFinite`, `point`, `Math.abs`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `header`; the dominant cost is nested iteration of depth 4 (map over header.segments; map over header.segments; every over [value.x, value.y, value.z]), performed once per call with 45 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 45 allocation sites become the returned value or die with the call, so nothing grows.
