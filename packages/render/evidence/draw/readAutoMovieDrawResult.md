# src/draw/readAutoMovieDrawResult.ts#readAutoMovieDrawResult

## @evidence contracts/development/common.md#meaningful-documentation

States what is read back, how it is encoded, and every member of the result and its source.

## @evidence contracts/development/implementation.md#principled-implementation

The canvas is read in the same task as the draw, before the browser can present and clear it, and every record comes from the inspection and placement the picture was drawn under.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The draw host owns drawing; this function owns only the read-back and the result's assembly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent diagnostics, palettes and mouths are left out rather than written as empty records.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the raster's pixels for the read-back and encoding, and in the scene's paths for pattern resolution.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own picture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The read-back buffer is call-local; the result is the caller's.