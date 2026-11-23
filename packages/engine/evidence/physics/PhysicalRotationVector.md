# src/physics/PhysicalRotationVector.ts#PhysicalRotationVector.log

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Shortest rotation vector in radians, canonical across quaternion sign.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Shortest rotation vector in radians, canonical across quaternion sign) directly over its typed inputs (`rotation`) as a fixed number of statements with no loop or recursion in the body, delegating to `Math.hypot`, `Math.atan2`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 13 lines and 4 top-level statements that reuses `Math.hypot`, `Math.atan2`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `rotation`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.

# src/physics/PhysicalRotationVector.ts#PhysicalRotationVector.exp

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Exponentiate a finite rotation vector, without an Euler-angle decomposition.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Exponentiate a finite rotation vector, without an Euler-angle decomposition) directly over its typed inputs (`vector`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.length`, `Math.sin`, `Math.cos`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 1e-12, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 10 lines and 3 top-level statements that reuses `Vector3.length`, `Math.sin`, `Math.cos` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12, 0.5 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `vector`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.

# src/physics/PhysicalRotationVector.ts#PhysicalRotationVector.derivative

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Convert a spatial angular velocity into the derivative of a shortest rotation vector.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Convert a spatial angular velocity into the derivative of a shortest rotation vector) directly over its typed inputs (`vector`, `velocity`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.length`, `Math.tan`, `Vector3.cross`, `Vector3.add`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.00001, 12, 720, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 12 lines and 4 top-level statements that reuses `Vector3.length`, `Math.tan`, `Vector3.cross`, `Vector3.add`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 0.00001, 12, 720, 0.5 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `vector`, `velocity`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.

# src/physics/PhysicalRotationVector.ts#PhysicalRotationVector.velocity

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Left-Jacobian action converts exponential-coordinate derivatives back to spatial angular velocity.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Left-Jacobian action converts exponential-coordinate derivatives back to spatial angular velocity) directly over its typed inputs (`vector`, `derivative`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.length`, `Math.cos`, `Math.sin`, `Vector3.cross`, `Vector3.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.00001, 0.5, 24, 3, 6, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 19 lines and 5 top-level statements that reuses `Vector3.length`, `Math.cos`, `Math.sin`, `Vector3.cross`, `Vector3.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 0.00001, 0.5, 24, 3, 6 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `vector`, `derivative`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
