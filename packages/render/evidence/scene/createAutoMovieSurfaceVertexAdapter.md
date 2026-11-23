# src/scene/createAutoMovieSurfaceVertexAdapter.ts#createAutoMovieSurfaceVertexAdapter

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Share one mesh's posed-point queries and inverse skin differential without changing its bones or weights) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Share one mesh's posed-point queries and inverse skin differential without changing its bones or weights) directly over its typed inputs (`mesh`) as a single pass (reduce over (mesh.morphTargetInfluences ?? [])), delegating to `mesh.getVertexPosition`, `point.set`, `mesh.applyBoneTransform`, `origin.set`, `x.set`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 44 lines and 7 top-level statements that reuses `mesh.getVertexPosition`, `point.set`, `mesh.applyBoneTransform`, `origin.set`, `x.set` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `mesh`; the dominant cost is a single pass (reduce over (mesh.morphTargetInfluences ?? [])), performed once per call with 12 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 12 allocation sites become the returned value or die with the call, so nothing grows.
