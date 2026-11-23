# src/scene/inspection/measureAutoMovieInspectionMeshes.ts#measureAutoMovieInspectionMeshes

## @evidence contracts/development/common.md#meaningful-documentation

States which meshes are drawn, which are measured and why selection does not narrow them, and which defect kinds exist.

## @evidence contracts/development/implementation.md#principled-implementation

Every mesh has edges and defects, so the inspection measures them as the renderer draws the meshes; a mark's path decides its selection afterwards, as for any supplied mark.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass listing the drawn meshes, then one producer call per kind family and mesh.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mesh is skipped by name, and a kind not asked is not measured.

## @evidence contracts/development/implementation.md#efficient-algorithms

Measurement runs only for asked kinds, and defects once per geometry through one shared cache.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The defect cache is shared by every mesh of the call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The measured records live as long as the caller keeps them; the cache dies with the call.
