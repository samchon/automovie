# src/drawing/autoMovieDrawingSpaceBox.ts#autoMovieDrawingSpaceBox

## @evidence contracts/development/implementation.md#principled-implementation

The bounds of the shell's vertices, or for cells the intersection of axis-aligned half-spaces per cell, which is exactly a box when each axis is closed, unioned across cells; folds go through `autoMovieDrawingRange`, so a shell of any vertex count is bounded without overflowing the stack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the declared-volume box the room schedule prints, with the per-cell box and axis test as private helpers because nothing else reads them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No space is special-cased; a non-axis-aligned or open cell is refused with `null` rather than boxed from a guess, and the axis tolerance absorbs only float noise.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the shell and cell readings, the union across cells, every case that yields `null` and why, the rounding and the units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the shell's vertex count, folded per axis without spreading, or in the cells' total plane count, with an early `null` on the first refused cell.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per space per room schedule; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a few small vectors and a corner list bounded by twice the cell count, all released on return.
