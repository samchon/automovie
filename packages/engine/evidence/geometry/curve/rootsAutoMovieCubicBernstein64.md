# src/geometry/curve/rootsAutoMovieCubicBernstein64.ts#rootsAutoMovieCubicBernstein64

## @evidence contracts/development/implementation.md#principled-implementation

Converts the cubic to power coefficients, obtains derivative roots with a cancellation-resistant quadratic formula and partitions before bisecting every remaining sign-changing interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar root operation owns the critical-point, tolerance, bisection and duplicate-root policies used by geometric intersections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Caller-admitted four finite coefficients are required; no sampled fitting, anatomical offset or zero-polynomial continuum is reported as an isolated root.

## @evidence contracts/development/common.md#meaningful-documentation

States the closed domain, exact numerical tolerances, iteration count, degeneracy and lack of an interval-proof claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

A cubic has at most two critical points and three sign-monotone intervals; at most 58 fixed bisections are performed per eligible interval.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure scalar operation schedules no cross-request work; callers own repeated-query reuse under their coefficient identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Critical points and isolated scalar roots remain invocation-local; the returned root array retains no curve or coefficient owner.
