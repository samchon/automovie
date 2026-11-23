# src/physics/measurePhysicalJointLimits.ts#measurePhysicalJointLimits

## @evidence contracts/development/implementation.md#principled-implementation

A joint with a sequential chart is read by the chart's own branch nearest its ranges (`AutoMoviePhysicalJointChart.nearest`), the reading the solver admits it by (`projectPhysicalJointRotation`), so an admitted pose reads within its limits; otherwise each free coordinate is the wrapped twist projection and each locked one 2 asin(q.axis). The premises are the units, frames and ranges stated in its parameter documentation; apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative rotation, then either the chart's reading or the per-axis projection, each mapped onto the three axes' violations; it reuses `Quaternion` and `AutoMoviePhysicalJointChart` from their owners and adds no option beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call: one relative rotation, at most one chart extraction with its twin branch, and three range lookups over the joint's at most three axes. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Measure every native angular constraint from displayed bone frames) as stated in this comment.
