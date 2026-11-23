# src/physics/admitPhysicalSupportPattern.ts#admitPhysicalSupportPattern

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Admit shared support geometry before tracking or recovery can dereference a carrier) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Admit shared support geometry before tracking or recovery can dereference a carrier) directly over its typed inputs (`profile`, `pattern`, `stepping`) as nested iteration of depth 3 (map over profile.segments; every over [value.x, value.y, value.z]; every over Array.from(values)), delegating to `Array.isArray`, `Array.from(values).every`, `Array.from`, `known.has`, `Number.isInteger`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (8 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 94 lines and 6 top-level statements that reuses `Array.isArray`, `Array.from(values).every`, `Array.from`, `known.has`, `Number.isInteger` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `profile`, `pattern`, `stepping`; the dominant cost is nested iteration of depth 3 (map over profile.segments; every over [value.x, value.y, value.z]; every over Array.from(values)), performed once per call with 14 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 14 allocation sites become the returned value or die with the call, so nothing grows.
