# src/physics/IAutoMoviePhysicalMaterial.ts#IAutoMoviePhysicalMaterial

## @evidence contracts/development/design.md#principled-representation

Separate compliance, depth and damping distinguish deformable contact response from a rigid collider's geometric extent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contact and native collider creation reference one profile-local material identity independently of optical rendering materials.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A material name never chooses response coefficients; compliance cannot remove the solid core or imply unbounded penetration.

## @evidence contracts/development/common.md#meaningful-documentation

Defines coefficient units, pair combination, required compliant depth and rigid-material omission.
