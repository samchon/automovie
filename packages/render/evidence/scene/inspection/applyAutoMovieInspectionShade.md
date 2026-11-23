# src/scene/inspection/applyAutoMovieInspectionShade.ts#applyAutoMovieInspectionShade

## @evidence contracts/development/common.md#meaningful-documentation

States what each shade draws and reveals, what deformation the inspection shades keep, and which shades an update moves.

## @evidence contracts/development/implementation.md#principled-implementation

Facing is the GPU rasterizer's own front-face test on the deformed, projected triangle, so the back colour appears exactly where winding and view disagree.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per shade family, each yielding the same handle; the two inspection shades differ only in the material their factory makes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shader is assembled from three.js's own chunks, so deformation and clipping are the renderer's, not a second implementation, and no mesh is skipped by name.

## @evidence contracts/development/implementation.md#efficient-algorithms

One material swap per mesh; the faces programs are shared by three.js across meshes with the same deformation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Material swapping, cycle and skinning inheritance, restoration and disposal are `overrideAutoMovieRenderModeMaterials`'s, and guide passes are `applyRenderMode`'s.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every override material, shell and segment is owned by the returned `restore`, which puts the originals back and disposes the overrides once; `update` allocates nothing.
