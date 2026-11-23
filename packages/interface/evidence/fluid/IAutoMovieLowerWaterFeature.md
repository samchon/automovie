# src/fluid/IAutoMovieLowerWaterFeature.ts#IAutoMovieLowerWaterFeature.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States static versus sampled time, feature/domain identity, camera-distance default and propagated failures.

## @evidence contracts/development/design.md#principled-representation

The binding and its domain remain separate records; time is shot seconds and cameraDistance is metres, with domain-id equality checked when lowering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

lowerWaterFeature reads the binding mode and delegates state, surface and spray sampling to the existing fluid owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Static deliberately ignores time; finite distance is required in every mode, and lowering does not replace domain or architecture admission.
