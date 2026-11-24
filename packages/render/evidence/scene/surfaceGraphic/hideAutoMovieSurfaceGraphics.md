# src/scene/surfaceGraphic/hideAutoMovieSurfaceGraphics.ts#hideAutoMovieSurfaceGraphics

## @evidence contracts/development/common.md#meaningful-documentation

States the passes that leave graphics out, why, and that only visible roots are hidden and restored.

## @evidence contracts/development/implementation.md#principled-implementation

Traverses the scene for marked roots, hides the visible ones and restores exactly those, so a key group the applier hid is untouched.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper the render-mode boundary calls for every pass but beauty and mask.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No material swap or depth offset stands in for hiding.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scene traversal per pass, linear in the object count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pass application hides and restores once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The restore closure holds the hidden roots until called; nothing else is retained.
