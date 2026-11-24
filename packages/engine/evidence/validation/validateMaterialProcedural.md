# src/validation/validateMaterialProcedural.ts#validateMaterialProcedural

## @evidence contracts/development/common.md#meaningful-documentation

States every admitted field, its range, the texture conflict, the UV0 requirement for pieces and that an absent surface is left alone.

## @evidence contracts/development/implementation.md#principled-implementation

Each check is a range the surface contract states; the texture conflict follows from both sources stating the same channels, and the UV0 requirement from a piece sampling its sheet through UV0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Structure: `validateModel` calls it once per material beside the lobe admission; the piece checks are a local helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Findings are reported at their own paths; nothing is repaired or defaulted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per material plus one scan of the parts for a piece material.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends to the caller's collector; retains nothing.
