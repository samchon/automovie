# src/core/ArchetypeMassLocal.ts#ArchetypeMassLocal

## @evidence contracts/development/common.md#meaningful-documentation

Defines local volume/centroid/principal mass data, explicit declaration and mismatch refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Primitives retain their existing closed forms. Explicit cells reuse their exact hull integration and principal frame; geometry identity proves that the mass belongs to the part drawn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the optional declared cell correspondence, otherwise dispatch the unchanged primitive owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never hulls an arbitrary mesh, fills a cavity or silently applies old physical data to a replacement geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

One keyed lookup and constant primitive work or a prepared-cell record read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both aggregate mass and per-part allocation read this same local owner; convex integration occurs once when its source cell is built.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns an owned source record or an ephemeral primitive result; retains no state or external resource.
