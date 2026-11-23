# src/physics/physicalJointMotorCommand.ts#physicalJointMotorCommand

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (The bounded quaternion PD command of one joint for the solver's implicit velocity motors) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (The bounded quaternion PD command of one joint for the solver's implicit velocity motors) directly over its typed inputs (`input`) as 2 sequential passes (for-of over input.joint.axes; for-of over input.joint.axes), delegating to `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 65 lines and 12 top-level statements that reuses `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (for-of over input.joint.axes; for-of over input.joint.axes), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
