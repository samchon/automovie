# src/physics/IAutoMoviePhysicalJointEffort.ts#IAutoMoviePhysicalJointEffort.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Explains override, recovery fraction and disturbance softening on the native clock.

## @evidence contracts/development/design.md#principled-representation

Dimensionless tracking fractions multiply independently; softenedUntil and seconds use the same local-second clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalJointEffort combines target, recovery and disturbance policies for the existing joint motors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent override preserves body effort and an absent softening deadline means no disturbance; no muscle strength is inferred from identity.
