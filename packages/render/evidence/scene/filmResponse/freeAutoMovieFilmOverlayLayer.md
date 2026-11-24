# src/scene/filmResponse/freeAutoMovieFilmOverlayLayer.ts#freeAutoMovieFilmOverlayLayer

## @evidence contracts/development/implementation.md#principled-implementation

The union of the camera's mask and every object's mask; the highest unset of the renderer's 32 layer bits isolates the overlays for their own draw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved out of the stage so the stage stays under the file size rule; the stage is its only caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bit is assumed free; a scene using all 32 throws.

## @evidence contracts/development/common.md#meaningful-documentation

States the choice and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal and at most 32 bit tests.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Recomputed per draw because masks change with inspection.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
