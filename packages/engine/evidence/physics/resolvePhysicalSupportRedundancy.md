# src/physics/resolvePhysicalSupportRedundancy.ts#resolvePhysicalSupportRedundancy

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Return a warm support seed's redundant coordinates to the authored posture) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Return a warm support seed's redundant coordinates to the authored posture) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.order; for-of over joint.axes; map over coordinates) plus a sort, delegating to `Number.isFinite`, `coordinates.push`, `coordinates.map`, `angle`, `projectPhysicalJointRotation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation that reuses `Number.isFinite`, `coordinates.push`, `coordinates.map`, `angle`, `projectPhysicalJointRotation` from their owners instead of copying them; its local helpers split the support rows by limb (`limbRows`, `witnesses`, `touches`) so the Jacobian evaluates only the limbs a probe moves, and it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 18 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`: the central-difference Jacobian (two probes per coordinate) and the singular value decomposition of the rows-by-coordinates design dominate, once per call. A probe moves only its joint's descendants, so each column evaluates the rows of the limbs it moves and leaves every other row at the exact zero its unchanged poses would give, instead of re-evaluating all limbs' rows twice per coordinate; each coordinate's index is looked up by joint and axis instead of searched, and the changed joints are collected once. The design matrix, and so the result, is bit-identical to the full evaluation; on the four-support primitive this cut the time under the function by about a fifth (CPU profile, 48 substeps), the decomposition now the larger share.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 19 allocation sites become the returned value or die with the call, so nothing grows.
