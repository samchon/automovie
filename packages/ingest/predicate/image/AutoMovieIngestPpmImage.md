# src/image/AutoMovieIngestPpmImage.ts#AutoMovieIngestPpmImage.decode

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names P6 and maxval 255, requires the transfer convention and size budgets, defines exactly where the raster starts, and describes the returned dimensions, sample ownership and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Header scanning interprets decimal tokens within the requested byte limit. The decoder consumes exactly one whitespace delimiter after maxval and requires three resident bytes per admitted pixel. It copies those bytes as samples, so a whitespace or comment-marker byte in the raster keeps its color value. The returned label records the caller's transfer convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

The decode scans the bounded header once and copies the exact raster once. Header work is bounded by maxHeaderBytes and the output allocation by maxPixels times three. It retains only the returned raster and has no file acquisition.
