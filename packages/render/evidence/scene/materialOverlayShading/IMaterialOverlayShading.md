# src/scene/materialOverlayShading/IMaterialOverlayShading.ts#IMaterialOverlayShading

## @evidence contracts/development/design.md#principled-representation

Represents decoded overlay textures separately from blend, linear colour factors, optional roughness/normal and their dimensionless scales.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface supplies exactly material composition inputs while texture decoding/cache ownership and shader source generation retain their own owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Strength and scales preserve application-admitted parameters; the type itself is not runtime range validation or a physical tissue acceptance verdict.

## @evidence contracts/development/common.md#meaningful-documentation

Members document sRGB/alpha versus linear factors, multiply/replace meaning and null keeping existing roughness/normal behavior.
