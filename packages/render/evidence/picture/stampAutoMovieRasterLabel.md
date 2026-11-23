# src/picture/stampAutoMovieRasterLabel.ts#stampAutoMovieRasterLabel

## @evidence contracts/development/common.md#meaningful-documentation

States the purpose, placement and how it is kept inside the picture, colours, character coverage and scale.

## @evidence contracts/development/implementation.md#principled-implementation

A bitmap font needs no font file or native canvas, so captions work in a page and in a Node host alike.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One box fill and one loop over glyph pixels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-positive or fractional scale throws; text wider than the frame is cut at the frame edge rather than wrapped onto content.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the caption's pixel area.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Glyph rows are fixed data shared by every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes into the frame's own bytes; allocates nothing else.
