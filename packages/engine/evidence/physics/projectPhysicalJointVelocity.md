# src/physics/projectPhysicalJointVelocity.ts#projectPhysicalJointVelocity

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Project a motor's requested relative angular velocity onto the linearized native coordinate box for the next substep), and why a chart joint's box is read in its chart, as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

The motor and the solver read one limit in the same coordinates: a joint declaring a sequential chart is limited on its chart angles by `projectPhysicalJointRotation` and `measurePhysicalJointLimits`, so its box is read there through `AutoMoviePhysicalJointChart.nearest`, each free axis's rate held between the rates reaching its ends within the substep; a box read in independent twist coordinates would ask e / h every substep of a rotation the solver admits (Mueller et al. 2020, section 3.3, v = dx / h). `test_physical_joint_chart_velocity` and `test_physical_xpbd_light_chain` pin both. Otherwise it implements the documented behavior directly over its typed inputs (`current`, `axes`, `requested`, `dt`) as nested iteration of depth 3 (for-of over axes; for-of over ["x", "y", "z"] as const; some over axes), delegating to `Number.isFinite`, `Vector3.scale`, `Vector3.add`, `Vector3.cross`, `axes.some`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 1e-12, 8, 1e-10, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 67 lines and 7 top-level statements that reuses `Number.isFinite`, `Vector3.scale`, `Vector3.add`, `Vector3.cross`, `axes.some` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12, 8, 1e-10 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `current`, `axes`, `requested`, `dt`; the dominant cost is nested iteration of depth 3 (for-of over axes; for-of over ["x", "y", "z"] as const; some over axes), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
