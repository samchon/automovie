# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition

## @evidence contracts/development/design.md#principled-representation

The planned layers of the picture being painted, null for one live layer, and the held copies of a transition's pictures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The scene mount, `mountAutoMovieInspectorScene`, is the one consumer of `prepare`, `drawsLive`, `finish` and `dispose`; planning and composition are render's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject, kind or shot is named; the plan's condition is the draw page's own, a plain beauty request.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment states when layers are planned, what `prepare` places, paints and holds and in which order, what `finish` composites, what other pictures do, and what still differs from delivery.

# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition.prototype.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what is planned and what is placed, painted and held before the caller's seek.

## @evidence contracts/development/implementation.md#principled-implementation

Plans with render's `planAutoMovieDrawLayers`, the draw page's planner, for a plain beauty request on a WebGL renderer, the condition under which the page composites; the outgoing layer carries its shot-local second at the painted second, so `seekShot` places it without the engine, and `beforeDraw` runs after the placement as the page runs it. Without an outgoing shot it returns null, so the mount seeks the live second in the same frame, as it did before transitions were painted; a mount disposed during the placement paints and holds nothing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Painting is the caller's, so the camera and response stay with the mount; holding is `AutoMovieTransitionDisplays`'.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A renderer double, which has no framebuffer to copy, plans no layers and paints as before; a missing `seekShot` is refused by the planner.

## @evidence contracts/development/implementation.md#efficient-algorithms

The planner's O(log E) search; inside a transition one placement, one paint and one copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held copy is reused while the drawing buffer keeps its size.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the plan of the picture being painted, replaced by the next.

# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition.prototype.finish

## @evidence contracts/development/common.md#meaningful-documentation

States when it runs and what it composites.

## @evidence contracts/development/implementation.md#principled-implementation

Holds the live picture when it is drawn and mixes the held layers by the plan's weights through `AutoMovieTransitionDisplays`, render's compositor path, over an opaque canvas.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composition is render's; this method assigns slots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does nothing without a plan or on a renderer double.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one copy and one composite.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The renderer's compositor state is reused across frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates through the displays only.

# src/inspector/AutoMovieInspectorTransition.ts#AutoMovieInspectorTransition.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes the held copies and the compositor states through `AutoMovieTransitionDisplays.dispose`.

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
