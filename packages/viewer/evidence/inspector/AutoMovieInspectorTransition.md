# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition

## @evidence contracts/development/design.md#principled-representation

The plan of the picture being painted, its composited layers or null and its shown layer or null, the compositor it was planned on, the held copies of a transition's pictures and their overlay scene.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The scene mount, `mountAutoMovieInspectorScene`, is the one consumer of `place`, `byShot`, `composites`, `finish`, `overlay`, `over` and `dispose`; planning, placement and composition are render's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject, kind or shot is named; the composite's condition is the draw page's own, a plain beauty request, and the shown layer is render's plan, so the two hosts cannot disagree.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment states what `place` plans and places and in which order, which pictures composite, what a weight-0 layer and a fade's midpoint do, what `finish` composites, where the witness cubes go, what other pictures do, and what still differs from delivery.

# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition.prototype.place

## @evidence contracts/development/common.md#meaningful-documentation

States what is planned, what is placed, painted and held, and that the shown layer is placed last.

## @evidence contracts/development/implementation.md#principled-implementation

Plans with render's `planAutoMovieDrawPicture`, the draw page's planner, and places through `placeAutoMovieDrawLayer`, so each layer is placed on its own entry's clock and the shot `playbackShownLayer` names is placed last, by `seekShot` when it is the outgoing shot; for a plain beauty request on a WebGL compositor every other layer of positive weight is placed, fed by `beforeDraw`, painted and held first, as the page does. A transition disposed during a placement paints and holds nothing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Painting is the caller's, so the camera and response stay with the mount; holding is `AutoMovieTransitionDisplays`'.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A renderer double, which has no framebuffer to copy, composites nothing but still places the shown shot last; a missing `seekShot` is refused by the planner.

## @evidence contracts/development/implementation.md#efficient-algorithms

The planner's O(log E) search and one placement, plus inside a composited transition one placement, one paint and one copy per other drawn layer; a layer of weight 0 costs nothing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held copies are reused while the drawing buffer keeps its size.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the plan of the picture being painted, replaced by the next.

# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition.prototype.finish

## @evidence contracts/development/common.md#meaningful-documentation

States when it runs, what it paints and composites, and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Paints and holds the shown layer when it has weight and mixes the held layers of positive weight by the plan's weights through `AutoMovieTransitionDisplays`, render's compositor path, over an opaque canvas; a fade's midpoint, with no layer of weight, is the cleared canvas, the black the fade reaches.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composition is render's; this method assigns slots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does nothing and returns false without a composited plan, so the mount paints as before.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one paint, one copy and one composite.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The renderer's compositor state is reused across frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates through the displays only.

# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition.prototype.over

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn over the composite and that it does not clear.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `AutoMovieTransitionDisplays.over` on the compositor, so the witness cubes stand over the composite at full strength, as the draw page draws them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The displays own the overlay scene and its draw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Draws nothing without a compositor or with an empty overlay.

## @evidence contracts/development/implementation.md#efficient-algorithms

One render of the overlay's objects.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each picture's overlay is drawn once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.

# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released and what a pending placement then does.

## @evidence contracts/development/implementation.md#principled-implementation

Marks the owner disposed, so a pending placement paints and holds nothing, and disposes the held copies and the compositor states through `AutoMovieTransitionDisplays.dispose`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One release path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Releases only what this owner made.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After it the owner holds no GPU resource.
