# src/physics/recordPhysicalContact.ts#recordPhysicalContact

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Merge core and compliant-surface impulses into one shape-pair episode) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Merge core and compliant-surface impulses into one shape-pair episode) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body, delegating to `JSON.stringify`, `Vector3.scale`, `Math.min`, `Math.max`, `Vector3.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 71 lines and 17 top-level statements that reuses `JSON.stringify`, `Vector3.scale`, `Math.min`, `Math.max`, `Vector3.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 13 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 13 allocation sites become the returned value or die with the call, so nothing grows.
