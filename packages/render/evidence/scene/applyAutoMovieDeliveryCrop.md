# src/scene/applyAutoMovieDeliveryCrop.ts#applyAutoMovieDeliveryCrop

## @evidence contracts/development/implementation.md#principled-implementation

Validates normalized crop edges through the engine resolver, then expresses them in Three's full-view coordinates (aspect by one); whole/omitted windows clear the offset, and positive finite camera aspect is the caller's projection premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps portable crop admission with the engine and owns only its Three view-offset realization; pose, renderer size and population culling are separate owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses geometric edges rather than scene names or special raster sizes; invalid crops throw before mutation, with no clamp or substituted camera method.

## @evidence contracts/development/common.md#meaningful-documentation

Documents normalized gate-window behavior, complete output raster, whole-window reset, camera-aspect premise and which camera fields change.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolves four edges and updates one fixed-size projection matrix in constant time/space, independent of output pixels or scene population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine resolver; camera projection is recomputed because aspect/fov/clip planes can change independently of an unchanged crop, so no crop-only cache is valid.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows and mutates one camera without retaining it, acquiring GPU state or scheduling work; Three owns its persistent view-offset record.
