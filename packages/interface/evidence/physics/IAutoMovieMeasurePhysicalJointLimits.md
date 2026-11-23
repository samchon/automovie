# src/physics/IAutoMovieMeasurePhysicalJointLimits.ts#IAutoMovieMeasurePhysicalJointLimits.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Measured native joint-coordinate angles and their unadjusted limit violations.

## @evidence contracts/development/design.md#principled-representation

The mutable array contains x, y and z in that order; angles and nonnegative violations are radians in the declared joint frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measurePhysicalJointLimits computes these from displayed parent and child poses; the caller independently chooses acceptable numerical tolerance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Free coordinates use wrapped twist projection and distance to the nearest limit; omitted axes are locked and report absolute locked-coordinate error. This measurement does not apply a solver tolerance.
