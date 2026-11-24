# src/physics/physicalContactSupportRows.ts#physicalContactSupportRows

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Keep an endpoint's existing XYZ promise and its explicitly declared real support plane in the same solve) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Keep an endpoint's existing XYZ promise and its explicitly declared real support plane in the same solve) directly over its typed inputs (`input`) as nested iteration of depth 3 (flatMap over profile.segments; map over segment.shapes; map over input.supports), delegating to `Number.isFinite`, `input.geometry.minimumY`, `physicalShapeBounds`, `physicalSupportPoint`, `Math.min`, `linearizePhysicalInterval`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 137 lines and 4 top-level statements that reuses `Number.isFinite`, `input.geometry.minimumY`, `physicalShapeBounds`, `physicalSupportPoint`, `linearizePhysicalInterval` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters. Each row's `measure` and `linearize` evaluate the same `minimum` and residual expressions at the poses they are given.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 5 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (flatMap over profile.segments; map over segment.shapes; map over input.supports), performed once per call. Each row then computes its geometry directly at every pose it is asked about: one `minimumY` query per floor row, and per support row one support point, one bound per carrier shape and one point per declared floor point. A probe allocates only its residual array, which the linearized support row edits in place. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each row recomputes from the poses it is given and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; the returned rows retain only their bone sets, the borrowed input and the closures over them, so nothing grows.
