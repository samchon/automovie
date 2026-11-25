# src/physics/IAutoMovieDerivePhysicalActuators.ts#IAutoMovieDerivePhysicalActuators.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Declared control assumptions used to size neutral downstream-load joint actuators.

## @evidence contracts/development/design.md#principled-representation

frequency is angular frequency in rad/s, dampingRatio is dimensionless, torquePerKg is N m/kg and passiveRate is inverse seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

derivePhysicalActuators computes stiffness as reference inertia times frequency squared, damping as twice dampingRatio times inertia times frequency, and caps as downstream mass times torquePerKg.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer rejects nonfinite values, nonpositive frequency or torquePerKg, and negative dampingRatio or passiveRate; omitted passiveRate is zero. These are policy assumptions rather than measured muscle strengths.
