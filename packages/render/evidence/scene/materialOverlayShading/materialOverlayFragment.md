# src/scene/materialOverlayShading/materialOverlayFragment.ts#materialOverlayFragment

## @evidence contracts/development/implementation.md#principled-implementation

Expands ordered layer uniforms and color/roughness alpha-times-strength coverage at the installed Three shader markers, delegating tangent-normal insertion to the shared splice owner. Replacement normal uses coverage; multiply normal scales xy by strength without alpha and retains sampled z, so zero strength is not a guaranteed identity over an existing tilted normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fragment-source generator consumes structural shapes while actual images, transforms and scalar values remain material uniforms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Existing blend/coverage/whiteout expressions are unchanged; supported shader markers and tangent-normal representation are premises, and generated strings alone do not prove compiled or observed shading.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation identifies colour, optional roughness and normal composition, required SDK markers and source-versus-appearance limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

For L layers and S shader bytes, source arrays/joins grow with enabled components and a fixed set of replacements/splices scans shader text; ordered full expansion is necessary for every enabled layer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal ordered shapes generate equivalent fragment structure and the material patch key permits native program reuse; image/scalar uniforms are not baked into a shared source cache here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary declarations/statements and the returned shader string contain no program or texture handle; compilation and native shader lifetime belong to Three/material ownership.
