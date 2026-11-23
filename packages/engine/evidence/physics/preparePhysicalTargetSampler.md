# src/physics/preparePhysicalTargetSampler.ts#preparePhysicalTargetSampler

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Compile one interval's motion coefficients) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Compile one interval's motion coefficients) directly over its typed inputs (`before`, `after`, `rate`) as a fixed number of statements with no loop or recursion in the body, delegating to `same`, `Vector3.subtract`, `Vector3.scale`, `Quaternion.multiply`, `Quaternion.inverse`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 47 lines and 6 top-level statements that reuses `same`, `Vector3.subtract`, `Vector3.scale`, `Quaternion.multiply`, `Quaternion.inverse` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `before`, `after`, `rate`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 14 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 14 allocation sites become the returned value or die with the call, so nothing grows.
