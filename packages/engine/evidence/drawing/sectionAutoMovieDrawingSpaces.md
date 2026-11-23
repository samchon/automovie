# src/drawing/sectionAutoMovieDrawingSpaces.ts#sectionAutoMovieDrawingSpaces

## @evidence contracts/development/implementation.md#principled-implementation

Sections each convex cell with `autoMovieDrawingCellSection` and measures it with the shoelace area, exact for the convex polygons a plane cuts from convex cells; the finish is a set intersection over the materials of the elements realizing the space's boundaries, which needs no tie-break because disagreement yields `null`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns region drafting and the facts its three gaps report, and the derivation only words the gaps; the finish table is a private helper because nothing else reads it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No space, cell or material is special-cased; shelled and unbounded volumes are counted for declared gaps rather than approximated, and a disputed finish is `null` rather than the first material found.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states what becomes a region, the rounding and order, the finish rule and why, and each counted case with its reason.

## @evidence contracts/development/implementation.md#efficient-algorithms

The finish table is built in one pass over the boundaries and the parts of their realizing elements' models instead of once per cell, and each cell is sectioned once in time quadratic in its plane count at worst; the final sort is `O(R log R)` in the region count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every cell of a space shares that space's one finish from the table, and element and model lookups come from the design index rather than scans.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The finish table and material sets live for the call and are released on return; they are bounded by the space count and the distinct materials per space, and only the returned regions and ids, owned by the caller, survive.
