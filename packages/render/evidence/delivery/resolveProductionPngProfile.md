# src/delivery/index.ts#resolveProductionPngProfile

## @evidence contracts/development/implementation.md#principled-implementation

Fixed sound-evidence sizes come from the engine writers' raster constants; other roles require positive safe-integer dimensions. This admits numeric profile records rather than encoded images and imposes no PNG field-width or decoder allocation limit; those remain serialization and probing concerns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One role switch picks the raster and one object literal spells the single supported format, so the profile shape stays in `IAutoMovieProductionPngProfile` and the comparison stays in `assertProductionPngPicture`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No caller or file is special-cased: the two fixed sizes are the engine writers' own defaults imported rather than restated, and a missing authored raster throws instead of falling back to a guessed size.

## @evidence contracts/development/common.md#meaningful-documentation

The doc says which roles take a fixed size and which take the passed raster, that the size arguments are pixels and ignored for fixed roles, which literals every profile carries, and when the call throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call does constant work: one role comparison, four integer checks and one eleven-field object, independent of image size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one small profile from its arguments and coordinates no phases or requests whose work could be shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The PNG profile is a fresh eleven-field record handed to the validator that requested it; the engine raster constant is read, never retained, and no file handle or task is opened.
