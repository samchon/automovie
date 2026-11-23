# src/drawing/autoMovieDrawingCellSection.ts#autoMovieDrawingCellSection

## @evidence contracts/development/implementation.md#principled-implementation

Sutherland-Hodgman clipping of a convex start polygon by each half-plane, which is exact for a convex intersection; the premises are a non-zero plane normal, which validation enforces, and the cell bound, which exceeds any authored building, and the one limitation is that a cell bounded only beyond ten kilometres reads as unbounded.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the world-to-page restatement, the clip and the boundedness verdict, and the per-plane clip is a private helper because nothing else clips a page polygon by a half-plane.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cell or plane is special-cased; the parallel-plane branch follows from the half-plane having no line on the page, and an unbounded cell is reported through `bounded` instead of being trimmed to a plausible room.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the half-space convention, the page restatement, the bound and what reaching it means, the meaning of an empty polygon, the parallel-plane rule, and the units and orientation of the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is the plane count times the current polygon size, which grows by at most one corner per plane, so it is quadratic in the plane count at worst and linear for an ordinary box cell; the clip stops as soon as the polygon empties.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one frame and one cell, called once per cell per drawing, so no equivalent request repeats within a derivation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each clip allocates a fresh polygon that the next clip replaces, and only the final one is returned to the caller; nothing is retained.
