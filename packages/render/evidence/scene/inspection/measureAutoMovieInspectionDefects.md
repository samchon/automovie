# src/scene/inspection/measureAutoMovieInspectionDefects.ts#measureAutoMovieInspectionDefects

## @evidence contracts/development/common.md#meaningful-documentation

States why the inspection measures this kind itself, how each defect becomes a mark, its kind, path, label and colour, the filter, the cache and its limit, what the posed coordinates include, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A defect is located by vertex indices into the stored buffer, so its mark keeps those indices and its coordinates are their posed positions in the mesh's space, which the mesh's world matrix carries into the scene.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measure through the cache, then one mark per kept defect with its index run, then a refresh that rewrites every mark from its run.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Edge or triangle is read from the defect's own vertex count, not from a list of kind names, and positions are read through the attribute so interleaved and normalized buffers give metres.

## @evidence contracts/development/implementation.md#efficient-algorithms

The engine's measure dominates and runs once per geometry; building and each refresh are linear in the marked vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's cache shares one measurement among meshes with the same geometry, the only input the defects depend on; the sliver limit is fixed for one inspection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The marks and their index runs live as long as the caller keeps the record; the mesh is borrowed and the cache is the caller's.
