# src/physics/physicalSupportSpanContacts.ts#physicalSupportSpanContacts

## @evidence contracts/development/common.md#meaningful-documentation

States the four support pieces, the hull of the planted contacts, the support left while a limb swings, the capture region on that support cut by the limb's reach discs and the weight's split at the pivot, and that none branches on a limb count or an anatomy.

## @evidence contracts/development/implementation.md#principled-implementation

The capture region is IHMC's `OneStepCaptureRegionCalculator.calculateCaptureRegion` (l.165-231) on any convex support through `physicalOneStepCaptureRegion.raw`, cut by the caller's reach discs as the 201903 quadruped's step adjustment bounds a step about its nominal one; the split is the least-norm nonnegative one, as IHMC's contact distribution keeps rho >= 0 (`WrenchMatrixCalculator`), solved by `solveDenseActiveSet`, a boundary pivot carried by its face alone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four pure functions over plain contacts; the split's boundary, line and plane cases each their own branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts, caches or fallbacks: a split the solver fails on a feasible program throws with its inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

The hull is n log n in the witnesses; the region intersects one polygon per disc; the split is one small dense program over the contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call answers one support at one instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
