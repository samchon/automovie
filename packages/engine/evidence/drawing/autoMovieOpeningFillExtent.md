# src/drawing/autoMovieOpeningFillExtent.ts#autoMovieOpeningFillExtent

## @evidence contracts/development/implementation.md#principled-implementation

Axis-aligned world extents from one fold per axis, with the vertical axis fixed by the engine's `+Y`-up world convention; the stated limitation is that a rotated or lying element reports its bounding extents rather than its own dimensions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rule turns world extents into a width and height pair for both opening fills and room boxes, so a door and a room are sized by the same reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element or orientation is special-cased, and the leaf-versus-hole difference is reported by the callers' basis label rather than corrected here.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the up axis, which extent becomes the width, the lying-leaf consequence, the empty-input precondition, the inputs callers pass and the units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three folds over the `n` corners through `autoMovieDrawingRange`, linear time with no argument spread, so a mesh of any size is measured without overflowing the stack.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per filled opening or room; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Streams the corner coordinates through generators and retains nothing.
