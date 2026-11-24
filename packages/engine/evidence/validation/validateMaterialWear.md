# src/validation/validateMaterialWear.ts#validateMaterialWear

## @evidence contracts/development/common.md#meaningful-documentation

States every admitted field, its range and that an absent record is left alone.

## @evidence contracts/development/implementation.md#principled-implementation

Each check is a range the wear contract states; a record without layers would shade nothing, so it is refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Structure: `validateModel` calls it once per material after the procedural admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Findings are reported at their own paths; nothing is repaired.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per material.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends to the caller's collector; retains nothing.
