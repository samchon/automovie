# src/picture/AutoMovieRasterSheet.ts#AutoMovieRasterSheet

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the fill order, both reductions and what each keeps, where captions are drawn and why, the memory bound, the extent of the result and how it is encoded.

## @evidence contracts/development/design.md#principled-representation

The sheet is itself an IAutoMovieRasterImage, so encoding and captioning reuse the frame path unchanged.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A constructor, `add` and `finish`, and the statics `lines` and `caption` that a layout reads to reserve the strip; layout is fixed by the constructor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing names a film or capture command; captions are caller text.

# src/picture/AutoMovieRasterSheet.ts#AutoMovieRasterSheet.caption

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, what the strip holds, the scale rule and its floor, and the spacing.

## @evidence contracts/development/implementation.md#principled-implementation

One line is exactly the stamp's box, `5 × scale` of glyph plus `2 × scale` of margin on each side; each further line adds its glyph and one font pixel of space, `6 × scale`, so a strip of `n` lines is `(6n + 3) × scale` and holds every line uncut. The scale follows the cell, as it did when captions were drawn inside it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression, shared by the sheet and every layout that reserves the strip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixed strip height: it follows the cell.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure expression.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number.

# src/picture/AutoMovieRasterSheet.ts#AutoMovieRasterSheet.wrap

## @evidence contracts/development/common.md#meaningful-documentation

States the wrapping rule and the long-word case.

## @evidence contracts/development/implementation.md#principled-implementation

A stamped box is `4 × scale × characters + 3 × scale` pixels wide, so a line holds `floor((width - 3 × scale) / (4 × scale))` characters, at least one; greedy filling at spaces keeps every word whole where it fits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the words, shared by the sheet and every layout that sizes a strip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No character is dropped: a word wider than the cell is broken, never cut.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the caption's length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its text and size.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh strings.

# src/picture/AutoMovieRasterSheet.ts#AutoMovieRasterSheet.lines

## @evidence contracts/development/common.md#meaningful-documentation

States what is counted and the floor.

## @evidence contracts/development/implementation.md#principled-implementation

Every cell of a sheet has one strip height, so the strip holds the longest wrapped caption.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `wrap` per caption.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No caption is assumed short.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the captions' total length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number.

# src/picture/AutoMovieRasterSheet.ts#AutoMovieRasterSheet.prototype.add

## @evidence contracts/development/common.md#meaningful-documentation

States that the frame fills the next cell and its caption the strip under it.

## @evidence contracts/development/implementation.md#principled-implementation

Under `area` each cell pixel averages the source pixels its footprint covers, so thin lines and small figures survive reduction instead of being skipped by point sampling; under `nearest` it copies the source pixel under its centre, `floor((x + 0.5) × source / cell)`, so every colour on the sheet is one the picture holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the cell's pixels, then one caption strip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A full sheet throws instead of overwriting a cell.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the source frame's pixel count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caption reuses the frame label stamp on a strip the width of the cell.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The frame is not retained.

# src/picture/AutoMovieRasterSheet.ts#AutoMovieRasterSheet.prototype.finish

## @evidence contracts/development/common.md#meaningful-documentation

States the extent of the result, how unfilled cells look, who owns the picture and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The extent follows the filled cell count, so a short last sheet carries no empty rows or columns for a reader to scroll or a model to spend attention on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A full sheet is returned; otherwise the filled extent is copied row by row.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty sheet throws rather than producing a blank image, and a partly filled sheet is copied instead of handing out a buffer a later `add` would rewrite.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time for a full sheet; linear in the filled extent otherwise.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A full sheet can take no further picture, so its own raster is returned without a copy.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned raster; the sheet keeps no buffer besides its own.
