# src/scene/filmShading/applyFilmIndirectPatch.ts#applyFilmIndirectPatch

## @evidence contracts/development/common.md#meaningful-documentation

States which light it multiplies, where, under which gate, which materials count as lit, the once-only rule and the refusal of a foreign compile hook.

## @evidence contracts/development/implementation.md#principled-implementation

Ambient occlusion scales indirect light only; placing the multiply after `aomap_fragment` composes it with a material's occlusion texture by multiplication and leaves every direct light already accumulated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One patch through `addMaterialShaderPatch`, the seam every material shader change uses; the stage owns the shared uniforms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A material whose hook the seam would silently replace is refused rather than patched.

## @evidence contracts/development/implementation.md#efficient-algorithms

One texture read per lit fragment while the gate is on.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared uniform objects let every frame reuse one compiled program per material.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The patch holds the stage's uniforms by reference; the material's owner releases the material.
