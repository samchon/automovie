# src/geometry/sweep/integrateAutoMovieSweepVolume.ts#integrateAutoMovieSweepVolume

## @evidence contracts/development/implementation.md#principled-implementation

The normal flux of a moving planar section (Hyun et al. 2005, The Visual Computer 21(8-10):542-550, Section 3.1) with its first-moment terms, by the midpoint rule, with the scale law of area and moments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one sum both `measureAutoMovieSweepVolume` and a posed sweep's volume preservation use, so the two cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No correction is applied for crossing sections; the premise is stated.

## @evidence contracts/development/common.md#meaningful-documentation

States the per-step term, the inputs' layout, the unit and the premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) arithmetic with no allocation, so a secant search over the scale can call it repeatedly.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure sum.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
