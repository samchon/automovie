# src/physics/IAutoMovieConfigurePhysicalJointMotor.ts#IAutoMovieConfigurePhysicalJointMotor.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Pre-integration angular tracking diagnostics from configuring one joint motor.

## @evidence contracts/development/design.md#principled-representation

error is a shortest-arc angular error norm in radians; saturated identifies requested torque coordinates above their configured caps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

configurePhysicalJointMotor returns the command's newly allocated diagnostic array after writing the joint's motor settings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These values describe the PD request, not observed motor impulse or successful tracking; a non-finite command throws before a result exists.
