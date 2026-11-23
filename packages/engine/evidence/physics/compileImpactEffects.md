# src/physics/compileImpactEffects.ts#compileImpactEffects

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Compile contact-driven spray through the existing effect stream and sampler) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Compile contact-driven spray through the existing effect stream and sampler) directly over its typed inputs (`input`) as nested iteration of depth 2 (every over [ input.endSeconds, input.fi; flatMap over input.contacts; map over samplePhysicalContactEvents(receipt)), delegating to `Number.isSafeInteger`, `samplePhysicalContactEvents`, `events.flatMap`, `Number.isFinite`, `structuredClone`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (5 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 4096, 7, 20, 16, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 110 lines and 5 top-level statements that reuses `Number.isSafeInteger`, `samplePhysicalContactEvents`, `events.flatMap`, `Number.isFinite`, `structuredClone` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (every over [ input.endSeconds, input.fi; flatMap over input.contacts; map over samplePhysicalContactEvents(receipt)), performed once per call with 23 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 23 allocation sites become the returned value or die with the call, so nothing grows.
