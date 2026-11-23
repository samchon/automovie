# src/geometry/curve/assertAutoMovieCurveBoundary64.ts#assertAutoMovieCurveBoundary64

## @evidence contracts/development/implementation.md#principled-implementation

Primitive admission checks the section, followed by matching span/control layout, finite derivative components, exact ID and declared physical units.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Boundary-specific checks extend primitive admission without converting the supplied field.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A finite supplied longitudinalAxis is accepted without a unit-length, regularity or section/derivative compatibility proof; callers retain those premises.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the exact one-turn sum, physical derivative denominator and checks that remain outside admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the section and derivative control counts; every represented coefficient must be examined.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No admission result is cached because caller-owned boundary arrays can change between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The assertion mutates and retains no boundary or coefficient array.
