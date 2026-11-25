# src/physics/IAutoMovieSamplePhysicalTarget.ts#IAutoMovieSamplePhysicalTarget.IResult

## @evidence contracts/development/common.md#meaningful-documentation

An interpolated authored goal and world velocity derived from its two endpoint poses.

## @evidence contracts/development/design.md#principled-representation

pose uses world metres and a unit quaternion; velocity is m/s and angularVelocity rad/s from the same shortest-arc rotation over the supplied interval rate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

samplePhysicalTarget allocates the pose and velocity vectors without changing either endpoint or advancing a physical solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies admitted finite poses, interpolation fraction and rate; this helper does not validate the clock. These are target velocities, not solved-body observations.
