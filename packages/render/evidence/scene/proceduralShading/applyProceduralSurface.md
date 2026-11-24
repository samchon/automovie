# src/scene/proceduralShading/applyProceduralSurface.ts#applyProceduralSurface

## @evidence contracts/development/common.md#meaningful-documentation

States the vertex sample point for both spaces and the bind pose, the three fragment splices and their anchors, the bump construction with its citation and how program keys are shared.

## @evidence contracts/development/implementation.md#principled-implementation

The sample point is the bind-pose `position` attribute or the affine UV mapping of the CPU reference, both exact under interpolation; the bump perturbs the normal by the screen-space height gradient in Mikkelsen's surface-gradient form of Blinn's bump mapping, with the height in metres matching view-space metres.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One patch through `addMaterialShaderPatch`, the seam every material shader change uses; the frame and module offset come from their engine owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uniforms are computed from the surface alone; nothing names a test or a scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

The pattern is evaluated once per fragment and reused for colour, roughness and height.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Materials of one kind and sampling space share a program key, so three compiles one program for them; seeds and colours are uniforms.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The uniforms live with the material and are released with it.
