# src/physics/physicalShapeQuery.ts#physicalShapeQuery

## @evidence contracts/development/implementation.md#principled-implementation

Spheres/capsules use the original closest segments, bare hull segments use physicalHullSegment, and searched shapes locate the convex gap's one low along the segment by Brent's method (`bracketedMinimum`) to `ALONG` of its length, then compare it with both ends; final readings use the same shape-local distance owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame composition and ordered shape branches serve both modes; the private box/round overloads select observed fields after computing their common distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not change any candidate, distance formula, threshold, taper, normal policy or tie; malformed shape fallthrough keeps its original error, and all inputs remain admitted pure DTO geometry during this synchronous call.

## @evidence contracts/development/implementation.md#efficient-algorithms

A bare round shape uses one closest-segment query; a searched segment costs Brent's evaluations (superlinear on a smooth gap, golden section's ratio at a kink) and the two ends' in place of 48 fixed ones, and one final reading. Full mode materializes contact fields; scalar reads, including hull search probes, omit only unobserved contact fields while all geometric query costs remain.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One body owns every distance for both facades. Fixed local endpoint differences serve interpolation, and fixed taper coefficients are read lazily at the original first widening use; multiplication/addition grouping remains unchanged. Same-record endpoint transforms, private probe/round-axis points and Vector3.distance's exact norm are shared only within this query. Both hull modes use physicalHullNearest's one numerical owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps call-local frame/interpolation scalars, at most two taper scalars and the lazy round-axis scratch. Scratch points are consumed synchronously and never returned; full final fields are independent. No pose, shape, callback, handle or result history survives return.

## @evidence contracts/development/common.md#meaningful-documentation

Detail mode selects whether the original full contact or only its signed distance is materialized, with world-metre geometry and optional nonnegative endpoint radii.
