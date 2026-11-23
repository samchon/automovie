# src/film/nodeSubjectBox.ts#nodeSubjectBox

## @evidence contracts/development/implementation.md#principled-implementation

The axis-aligned bound of a transformed box is the range of its eight transformed corners, because an affine image of a box is the convex hull of its corners' images; the corners go through the same scale-rotate-translate order the renderer uses, and the zero-width extent is routed to the point box by an exact comparison because `nodeSubjectExtent` writes literal zeros.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One box rule read by the framing solve, the shot-contract grade, the clearance reports and the film-grammar diagnostics, so the box a camera was solved for is the box it is graded against.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No node, model or shot is special-cased; exact zero horizontal coordinates select the stand-in policy, including the documented ambiguity with measured vertical segments.

## @evidence contracts/development/common.md#meaningful-documentation

States affine corner placement, shared consumers, frames and units, and the zero-width policy that ignores rotation and scale even for indistinguishable measured vertical segments.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: eight corner placements folded into a running minimum and maximum without building a corner array.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one placement and one extent; `performShot` memoizes the measured extent it is fed, and this constant-time placement is recomputed per instant because the placement moves.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The eight placed corners are discarded as they are folded; the caller owns the returned box, which shares no object with the placement or the extent.
