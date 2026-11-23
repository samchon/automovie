# src/delivery/assertProductionPngPicture.ts#assertProductionPngPicture

## @evidence contracts/development/implementation.md#principled-implementation

Every compared field is a scalar compared by identity against the profile, and pixel aspect is judged by the ratio itself, `x === y`, because a PNG may declare square pixels with any equal pair of densities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered list of named comparisons is the whole check, so the error names the first failing field; the profile's raster rules stay in `resolveProductionPngProfile`, which built it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The profile's `version` and `role` are not picture facts and are not compared, and no role relaxes a field.

## @evidence contracts/development/common.md#meaningful-documentation

The doc lists the compared fields, the pixel-aspect rule with its absent case, the order that decides the reported field, and the error contents.

## @evidence contracts/development/implementation.md#efficient-algorithms

The check compares a fixed set of eight or nine scalars in constant time, independent of the picture size, because the parser has already decoded the facts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call judges one parsed picture against one profile, and different delivered PNGs are not equivalent work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the small comparison list exists during the call, and the function opens no file or task.
