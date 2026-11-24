# src/draw/planAutoMovieDrawPicture.ts#planAutoMovieDrawPicture

## @evidence contracts/development/common.md#meaningful-documentation

States what the plan holds, which rule chooses the shown layer and the placed entry, who plans through it and what it throws.

## @evidence contracts/development/implementation.md#principled-implementation

The layers are `planAutoMovieDrawLayers`' and the shown layer `playbackShownLayer`'s, the engine's one rule for the shot a frame shows most of, and outside a transition the placed entry is `playbackEntryAt`'s live entry, so the draw page's picture, its trails and its framing and the Viewer cannot disagree.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three calls to their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The refusal for an outgoing shot without `seekShot` is the layer plan's, not swallowed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two O(log E) searches and a constant choice among at most two layers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call plans one second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh data and retains nothing.
