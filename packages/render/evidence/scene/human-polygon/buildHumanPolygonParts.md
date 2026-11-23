# src/scene/human-polygon/buildHumanPolygonParts.ts#buildHumanPolygonParts

## @evidence contracts/development/implementation.md#principled-implementation

Ring selection and ring points come from `resolveAutoMovieHumanoidRingModules`; this function only hands each module's sections, with their actual points, to the supplied assembler in the engine's drawing order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates module selection, owned by the engine, from drawing lifecycle, palette and pose application; it borrows the caller's bone lookup and add callback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No section dimension, anatomy coefficient or authored pose is stated here; a module whose bone the drawing lacks is refused by the lookup.

## @evidence contracts/development/common.md#meaningful-documentation

Records who owns the form, why the drawing reads it and what this function returns.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the engine's modules, at most one per emitted bone, with map lookups.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's rings and points and the caller's maps and material-owning assembler.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary vectors and sections transfer to assembly; the caller owns every emitted mesh, diagnostic and material and receives the actual head objects and bounds.
