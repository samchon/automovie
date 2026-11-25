# src/animals/createGroomingBrush.ts#createGroomingBrush

## @evidence contracts/development/implementation.md#principled-implementation

Two boxes from the drawn dimensions: the back above the bristles; the grip on the back's top and the working face on the bristles' bottom.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw, lay two boxes, declare two contacts, build.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Back thickness and mass are named authored values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared builder and draw session.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the brush lies, how it is held, its two contacts and which values are read and authored.
