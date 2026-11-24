# src/physics/physicalQuadrupedCopTrajectory.ts#physicalQuadrupedCopTrajectory

## @evidence contracts/development/common.md#meaningful-documentation

States the load split per end, why the pitch fit is not computed, the regularized mean, the no-contact case and the empty-sequence error.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `QuadrupedPiecewiseConstantCopTrajectory.initializeTrajectory` (l.100-146) with `computeNominalNormalizedContactPressure` (l.91-144) and `computeCenterOfPressure` (l.21-35). The forward fraction is the DCM planner's default maximum shift, zero (DCMPlanner l.77), times a clamped pitch ratio (l.99-103), so it is zero for any finite pitch and `PitchEstimator` is not evaluated. The per-interval shares contributed by initial contacts and queued steps (l.123-140) are not kept, as the DCM planner reads none.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over the phases; the pressure split is a helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The forward fraction is a named zero with its source; the sum starts at the reference's 1e-6.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the phases.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the sequence.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedCopTrajectory.ts#physicalQuadrupedCopTrajectory

## @evidence contracts/development/common.md#meaningful-documentation

Documents the interval.

## @evidence contracts/development/design.md#principled-representation

The reference's interval start times and centre-of-pressure waypoints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the DCM planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedCopTrajectory.ts#physicalQuadrupedCopTrajectory.IInterval

## @evidence contracts/development/common.md#meaningful-documentation

Documents the start and the point with units.

## @evidence contracts/development/design.md#principled-representation

One interval's start time, seconds, and constant centre of pressure, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the DCM planner's backward integration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.
