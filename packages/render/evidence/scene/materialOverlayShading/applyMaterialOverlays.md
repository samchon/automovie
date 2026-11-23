# src/scene/materialOverlayShading/applyMaterialOverlays.ts#applyMaterialOverlays

## @evidence contracts/development/implementation.md#principled-implementation

Registers ordered color/roughness and replacement-normal coverage by alpha times strength. Multiply normals instead use strength-scaled xy and the sampled z in whiteout, ignoring alpha and potentially changing an existing normal at zero strength. Public compile hooks add the shared conventional flat normal when a tangent frame is required.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uniform values stay material-local while structural overlay shapes select shared vertex/fragment generators and their program key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Texture transforms and order are preserved, no SDK prototype/internal is replaced and registration assumes the existing buildMaterial precompile phase rather than patching a compiled material silently.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation describes blend/coverage/normal semantics, optional roughness and the flat-normal prerequisite without claiming an observed material appearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

For L layers, uniform/shapes/key construction is O(L); shader expansion and actual per-pixel texture samples grow with enabled layer components.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ordered blend/roughness/normal shapes identify program-source equivalence while colour/normal texture transforms and scalar uniforms remain distinct per material.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The material and its patch closure retain O(L) overlay/uniform references until material release; textures are borrowed, the flat normal is one module singleton and this helper has no layer-count cap or unregister API.
