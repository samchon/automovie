# src/physics/derivePhysicalActuators.ts#derivePhysicalActuators

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Size declared actuators from the entire neutral downstream load about each joint) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Size declared actuators from the entire neutral downstream load about each joint) directly over its typed inputs (`segments`, `joints`, `options`) as nested iteration of depth 3 (every over [options.frequency, options.torquePerKg]; map over joints; find over segments), delegating to `Number.isFinite`, `joints.map`, `segments.find`, `Vector3.add`, `Quaternion.rotateVector`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 111 lines and 2 top-level statements that reuses `Number.isFinite`, `joints.map`, `segments.find`, `Vector3.add`, `Quaternion.rotateVector` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `segments`, `joints`, `options`; the dominant cost is nested iteration of depth 3 (every over [options.frequency, options.torquePerKg]; map over joints; find over segments), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
