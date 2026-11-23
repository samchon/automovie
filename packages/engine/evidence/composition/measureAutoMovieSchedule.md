# src/composition/measureAutoMovieSchedule.ts#measureAutoMovieSchedule

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Measure a schedule's pacing against the production's own classification: actions per minute, the share of actions that follow the same subject's previous action within the combination gap, each subject's lateral share of displacement and idle seconds over its presence, and the share of time a camera entry moves with the cut cadence) and documents parameters `schedule`, `classify`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Measure a schedule's pacing against the production's own classification: actions per minute, the share of actions that follow the same subject's previous action within the combination gap, each subject's lateral share of displacement and idle seconds over its presence, and the share of time a camera entry moves with the cut cadence) directly over its typed inputs (`schedule`, `classify`) as nested iteration of depth 3 (filter over schedule.entries; for-of over actions; for-of over new Set( schedule.entries.map((e: IA), delegating to `classify.action`, `last.get`, `last.set`, `classify.displacement`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 60, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 68 lines and 11 top-level statements that reuses `classify.action`, `last.get`, `last.set`, `classify.displacement`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 60, 0.5 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `schedule`, `classify`; the dominant cost is nested iteration of depth 3 (filter over schedule.entries; for-of over actions; for-of over new Set( schedule.entries.map((e: IA), performed once per call with 8 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 8 allocation sites become the returned value or die with the call, so nothing grows.
