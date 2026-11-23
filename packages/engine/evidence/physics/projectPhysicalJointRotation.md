# src/physics/projectPhysicalJointRotation.ts#projectPhysicalJointRotation

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Admit a relative joint rotation to the solver's independent twist coordinates, 2 atan(q.axis / w) per free axis) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Admit a relative joint rotation to the solver's independent twist coordinates, 2 atan(q.axis / w) per free axis) directly over its typed inputs (`joint`, `rotation`) as nested iteration of depth 2 (for-of over ["x", "y", "z"] as const; find over joint.axes), delegating to `Math.hypot`, `Number.isFinite`, `Math.max`, `Math.abs`, `Math.atan2`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 46 lines and 8 top-level statements that reuses `Math.hypot`, `Number.isFinite`, `Math.max`, `Math.abs`, `Math.atan2` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `joint`, `rotation`; the dominant cost is nested iteration of depth 2 (for-of over ["x", "y", "z"] as const; find over joint.axes), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
