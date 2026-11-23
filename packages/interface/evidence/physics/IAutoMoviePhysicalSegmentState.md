# src/physics/IAutoMoviePhysicalSegmentState.ts#IAutoMoviePhysicalSegmentState

## @evidence contracts/development/common.md#meaningful-documentation

Observed pose and velocity of one bone origin in world coordinates.

## @evidence contracts/development/design.md#principled-representation

Inherited position is metres and rotation is a unit quaternion; velocity is m/s and angularVelocity rad/s in world axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Simulation capture writes the segment record and cache/playback interpolation returns newly allocated samples for display and audit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This is bone-origin velocity, not automatically COM velocity or the derivative of an interpolated display path; consumers must preserve that distinction.
