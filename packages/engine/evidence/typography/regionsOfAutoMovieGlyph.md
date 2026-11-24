# src/typography/regionsOfAutoMovieGlyph.ts#regionsOfAutoMovieGlyph

## @evidence contracts/development/implementation.md#principled-implementation

Flattens each contour in metres within the tolerance, refuses touching or crossing rings by exact orientation signs, then groups rings by containment parity: even nesting depth bounds ink and odd depth is a hole of the innermost enclosing ring, as #4098 requires instead of winding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by the flat and raised builders, so both group and refuse glyphs identically; triangulation and extrusion stay with their callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Crossing or touching contours refuse naming the code point; only exact consecutive duplicate points are merged, which carry no shape.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and units, the grouping rule and its reason, the refusals and the cost.

## @evidence contracts/development/implementation.md#efficient-algorithms

Quadratic in the glyph's flattened edges for the crossing test and quadratic in its rings for containment; callers compute each distinct code point once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The builders cache its result per code point within one call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned rings linear in the flattened points and retains nothing.
