# src/material/IAutoMovieMaterialWear.ts#IAutoMovieMaterialWear

## @evidence contracts/development/design.md#principled-representation

A seed and two optional layers placed by distance in metres to the mesh's convex and concave feature edges. The requirement of at least one layer, the seed range and every layer range remain for `validateMaterialWear`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface package owns it as `IAutoMovieMaterial.wear`; the engine admits it and computes the CPU weight, and render's `applyMaterialWear` shades it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Edge and grime are separate named layers rather than a list, because each reads a different edge sign.

## @evidence contracts/development/common.md#meaningful-documentation

States the weight formula, the noise, the mixing order, the bind-pose rule, what it leaves to occlusion and the admission owner.

# src/material/IAutoMovieMaterialWear.ts#IAutoMovieMaterialWear.ILayer

## @evidence contracts/development/design.md#principled-representation

A linear colour, a roughness, a band width in metres and a coverage fraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shader reads all four.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The colour reuses `IAutoMovieColor`.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit, range and effect.
