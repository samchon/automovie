# src/scene/wearShading/applyMaterialWear.ts#applyMaterialWear

## @evidence contracts/development/common.md#meaningful-documentation

States the bind-pose measurement, the non-indexed draw, the texture layout, the fragment computation, the splice points and the ownership of the returned objects.

## @evidence contracts/development/implementation.md#principled-implementation

Per-fragment distances to feature edges measured once on the bind pose keep wear independent of tessellation and attached to the skin; the texture is read with `texelFetch` so values are exact float32; the weight is the engine's `autoMovieWearWeight` written in GLSL.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measurement is delegated to the engine; the patch goes through `addMaterialShaderPatch`, the seam every material shader change uses, and reads the shared lattice GLSL; `buildModel` decides which parts are worn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mesh or scene is special-cased; the 16-entry loop bound is the measurement's list limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

The measurement dominates (O(T × E) once per part); each fragment reads at most 16 edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The worn material is not shared across parts, because its texture uniform belongs to one geometry; materials of the same layers share a program key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned geometry and texture are owned by the caller, which `buildModel` registers with the part's owned resources so they are disposed with it.
