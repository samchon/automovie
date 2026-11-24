# src/physics/physicalRecoverySupportGoals.ts#physicalRecoverySupportGoals

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Recover original declared world endpoints at a single clock) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Recover original declared world endpoints at a single clock) directly over its typed inputs (`body`, `target`, `pattern`, `state`, `seconds`, `path`) as nested iteration of depth 2 (map over pattern.limbs; find over body.balance?.pattern.limbs), delegating to `Object.fromEntries`, `physicalSupportPoint`, `samplePhysicalRecoveryGoal`, `Vector3.add`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 40 lines and 1 top-level statements that reuses `Object.fromEntries`, `physicalSupportPoint`, `samplePhysicalRecoveryGoal`, `Vector3.add`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `body`, `target`, `pattern`, `state`, `seconds`, `path`; the dominant cost is nested iteration of depth 2 (map over pattern.limbs; find over body.balance?.pattern.limbs), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
