# src/font/AutoMovieIngestFont.ts#AutoMovieIngestFont.decode

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the supported font container, character-map precedence, output units and ownership. It identifies optional kerning and names, skipped hinting and checksums, and refusal at table or glyph boundaries.

## @evidence contracts/development/implementation.md#principled-implementation

The decoder reads big-endian sfnt offsets and clips each selected table to its declared byte length. The cmap and kern readers also clip selected subtables before interpreting offset or count fields. Loca offsets confine glyphs to glyf and bound the record for each outline. The reader converts run-length flags and coordinate deltas into points. Off-curve neighbors contribute their midpoint, and the composite transform applies to each expanded component.

## @evidence contracts/development/implementation.md#efficient-algorithms

One directory scan prepares table extents. Each reader borrows its byte extent, and the decode caches outlines by glyph index for repeated components. Work follows selected mappings, glyph records, emitted contours and expanded kerning pairs. The per-call readers and outline cache are discarded at completion or refusal. Returned outlines own their coordinates.
