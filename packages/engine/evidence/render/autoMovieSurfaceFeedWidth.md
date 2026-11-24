# src/render/autoMovieSurfaceFeedWidth.ts#autoMovieSurfaceFeedWidth

## @evidence contracts/development/common.md#meaningful-documentation

States the width rule, its units and why it rounds and floors at one, and names its two consumers.

## @evidence contracts/development/implementation.md#principled-implementation

A feed shows its camera's view undistorted when its target has the aspect of the box it fills on the face, and the box's metric size is its face fractions times the surface's width and depth; the height is the authored `pixels`, so the width follows from that aspect, rounded to a whole pixel and never below one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rule shared by `render`, which allocates the target, and the render inventory, which counts its bytes, so the count cannot drift from the allocation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fitted value: the width is the box's aspect times the authored height.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure arithmetic rule with nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains and allocates nothing.
