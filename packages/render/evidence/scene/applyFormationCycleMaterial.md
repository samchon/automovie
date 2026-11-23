# src/scene/applyFormationCycleMaterial.ts#applyFormationCycleMaterial

## @evidence contracts/development/implementation.md#principled-implementation

Injects sampled part-affine matrices before native instance placement and applies their 3x3 to normals; normalized phase wraps cycle columns and interpolates neighboring Float32 matrices. Correct part/phase attributes and compatible Three shader chunks are premises, with linear matrix interpolation not exact rotational slerp and no inverse-transpose correction for arbitrary nonuniform deformation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the same cycle uniforms/injection across visible and structural/shadow material classes instead of separate animation implementations; bake storage and per-tier cadence remain with their owning helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual baked tables and per-member radius/phase, not fixture poses; native compile hooks are supported extension points, but replacing unrelated existing hook logic and silent missing chunk replacement remain documented compatibility limits.

## @evidence contracts/development/common.md#meaningful-documentation

Gives model-before-instance ordering, shared normal/depth behavior, affine Float32 row storage, matrix interpolation approximation and installed-hook ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Installs one hook and fixed GLSL strings; each vertex performs constant-count adjacent texture reads/matrix arithmetic, while program compile source replacement is linear in shader source length and independent of population count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All materials of a tier borrow the same mutable cycle uniform cells/textures and the fixed structural program key allows Three program reuse; changing cadence uniforms avoids recompilation, while installing injection marks needsUpdate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Material compile closure retains the borrowed cycle/uniforms until material references are released; owns no texture or task itself, and tier bake/runtime disposal must retire the shared textures after borrowers are closed.
