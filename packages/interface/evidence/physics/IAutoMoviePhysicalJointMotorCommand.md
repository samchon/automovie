# src/physics/IAutoMoviePhysicalJointMotorCommand.ts#IAutoMoviePhysicalJointMotorCommand.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes bounded motor commands, geodesic error and pre-solve saturation forecasts.

## @evidence contracts/development/design.md#principled-representation

axes retain declaration order; error is radians and saturated identifies joint-frame torque demands above their caps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalJointMotorCommand supplies configurePhysicalJointMotor with one command per declared axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Saturation forecasts demand because the native SDK does not expose achieved motor impulse; it is not an observed torque measurement.

# src/physics/IAutoMoviePhysicalJointMotorCommand.ts#IAutoMoviePhysicalJointMotorCommand.IAxis

## @evidence contracts/development/common.md#meaningful-documentation

States the axis, target speed, implicit damping and torque cap of one native motor.

## @evidence contracts/development/design.md#principled-representation

The axis literal selects a joint-frame coordinate; speed is rad/s, damping N m s/rad and maximumTorque N m.

## @evidence contracts/development/design.md#minimal-and-owned-surface

configurePhysicalJointMotor consumes the command produced by physicalJointMotorCommand to set the corresponding native velocity motor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An inactive motor has zero cap; finite native representability remains runtime admission before the SDK write.

# src/physics/IAutoMoviePhysicalJointMotorCommand.ts#IAutoMoviePhysicalJointMotorCommand.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Describes shortest-arc PD tracking, passive damping, feed-forward and one positive native substep.

## @evidence contracts/development/design.md#principled-representation

Child-relative unit quaternions, joint-frame rad/s velocities and N m feed-forward share the profile joint frame; strength lies in [0,1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalJointMotorCommand reads gains and caps from the canonical profile joint instead of duplicating actuator policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The command uses admitted independent twist limits and bounded native motors; its error and saturation are requests before integration.
