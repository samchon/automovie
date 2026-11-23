# src/composition/resolveAutoMovieFraming.ts#resolveAutoMovieFraming

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (A camera pose meeting a framing goal from the subjects' actual bounding spheres: the target is the centre of the smallest sphere about their centroid that contains every subject sphere, and the camera stands on the goal's bearing and elevation at the distance where that sphere's diameter fills the declared share of the vertical field of view, `d = r / (fill tan(fov / 2))`) and documents parameters `goal`, `state`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (A camera pose meeting a framing goal from the subjects' actual bounding spheres: the target is the centre of the smallest sphere about their centroid that contains every subject sphere, and the camera stands on the goal's bearing and elevation at the distance where that sphere's diameter fills the declared share of the vertical field of view, `d = r / (fill tan(fov / 2))`) directly over its typed inputs (`goal`, `state`) as 5 sequential passes (map over goal.subjects; reduce over spheres; reduce over spheres), delegating to `Math.abs`, `spheres.reduce`, `Math.max`, `spheres.map`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 60 lines and 8 top-level statements that reuses `Math.abs`, `spheres.reduce`, `Math.max`, `spheres.map`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `goal`, `state`; the dominant cost is 5 sequential passes (map over goal.subjects; reduce over spheres; reduce over spheres), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
