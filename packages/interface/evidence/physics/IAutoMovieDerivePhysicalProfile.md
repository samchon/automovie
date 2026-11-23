# src/physics/IAutoMovieDerivePhysicalProfile.ts#IAutoMovieDerivePhysicalProfile.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Explains density overrides, physical materials, explicit joint replacement, actuator assumptions and provenance.

## @evidence contracts/development/design.md#principled-representation

Densities use kg/m³; actuator frequency is rad/s and torque scaling N m/kg. Overrides retain canonical segment and joint records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

derivePhysicalProfile uses these provider policies to turn model geometry into the shared physical profile; material ownership remains with the profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit joints bypass rig derivation; otherwise actuator policy is required at runtime. Densities and replacement completeness are not inferred from names.
