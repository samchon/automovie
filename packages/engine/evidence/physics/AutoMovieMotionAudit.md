# src/physics/AutoMovieMotionAudit.ts#AutoMovieMotionAudit.run

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Sample all bodies, support windows, speeds, floor clearances and pair contacts.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Sample all bodies, support windows, speeds, floor clearances and pair contacts) directly over its typed inputs (`input`) as nested iteration of depth 5 (for loop bounded by index <= count; for-of over input.bodies; for-of over motionAuditGeometry(body).joints), delegating to `admitPhysicalMotionAudit`, `Geometry`, `Math.ceil`, `Math.min`, `input.sample`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One async operation of 195 lines and 7 top-level statements that reuses `admitPhysicalMotionAudit`, `Geometry`, `Math.ceil`, `Math.min`, `input.sample` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 5 (for loop bounded by index <= count; for-of over input.bodies; for-of over motionAuditGeometry(body).joints), performed once per call with 17 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
