# src/physics/AutoMoviePhysicalTracking.ts#AutoMoviePhysicalTracking.torque

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Calculate a torque without retaining a controller state or changing inputs.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Calculate a torque without retaining a controller state or changing inputs) directly over its typed inputs (`current`, `target`, `velocity`, `axes`, `inertia`, `dt`, `strength`) as a single pass (for-of over axes), delegating to `Number.isFinite`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 44 lines and 9 top-level statements that reuses `Number.isFinite`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `current`, `target`, `velocity`, `axes`, `inertia`, `dt`, `strength`; the dominant cost is a single pass (for-of over axes), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.

# src/physics/AutoMoviePhysicalTracking.ts#AutoMoviePhysicalTracking.force

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Root positional PD; gravity compensation is explicit in the caller's acceleration.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Root positional PD; gravity compensation is explicit in the caller's acceleration) directly over its typed inputs (`error`, `velocity`, `mass`, `stiffness`, `damping`, `maximumForce`, `dt`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.scale`, `Vector3.subtract`, `Vector3.length`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 13 lines and 3 top-level statements that reuses `Vector3.scale`, `Vector3.subtract`, `Vector3.length` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `error`, `velocity`, `mass`, `stiffness`, `damping`, `maximumForce`, `dt`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
