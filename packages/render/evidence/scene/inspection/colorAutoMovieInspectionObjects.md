# src/index.ts#colorAutoMovieInspectionObjects

## @evidence contracts/development/common.md#meaningful-documentation

States which mesh takes which colour, how each shade draws it and why, what deformation is kept, and the refusal under a guide pass.

## @evidence contracts/development/implementation.md#principled-implementation

An identity colour is a material of that colour, lit under clay so form reads and unlit under beauty so the colour is exact; formation cycles and dual-quaternion skins are carried by the same patches the render-mode overrides use.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass choosing each mesh's colour, one swap per matched mesh, and one restore.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mesh is matched by anything but its path, and a pass that would lose its meaning is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Meshes times colour entries pattern matches, one material per matched mesh.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The deformation patches are the formation-cycle and dual-quaternion owners'.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The created materials are owned by the returned call, which puts the meshes' materials back and disposes them; the meshes are borrowed.
