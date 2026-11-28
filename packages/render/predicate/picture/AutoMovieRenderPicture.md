# src/picture/AutoMovieRenderPicture.ts#AutoMovieRenderPicture.labelBox

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes the clamped pixel rectangle, scaled glyphs and integer scale.

## @evidence contracts/development/implementation.md#principled-implementation

The label box uses the font's four-pixel cell pitch and padding. Rounding keeps the anchor on the requested pixel grid, and clamping keeps the returned rectangle in the raster. The stamp and label placer consume the same rectangle calculation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computing the rectangle reads the label text once to count normalized glyphs. It neither draws nor scans the raster.

# src/picture/AutoMovieRenderPicture.ts#AutoMovieRenderPicture.stampRasterLabel

## @evidence contracts/development/common.md#meaningful-documentation

The contract states the optional anchor, builtin font and mutation of the supplied raster.

## @evidence contracts/development/implementation.md#principled-implementation

The raster stamp paints the rectangle reported by the same bounds calculation used to admit overlaps. The glyph loops and clamped row writer use that coordinate system, including the right and bottom edges.

## @evidence contracts/development/implementation.md#efficient-algorithms

It writes only the rectangle and glyph pixels. The glyph lookup comes from a fixed 3-by-5 character table.
