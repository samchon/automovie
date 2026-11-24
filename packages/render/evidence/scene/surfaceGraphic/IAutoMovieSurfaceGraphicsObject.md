# src/scene/surfaceGraphic/IAutoMovieSurfaceGraphicsObject.ts#IAutoMovieSurfaceGraphicsObject

## @evidence contracts/development/common.md#meaningful-documentation

States the roots' names and parents, by which a host finds them, the applier's time range and refusal, the feed draw, and what disposal releases.

## @evidence contracts/development/design.md#principled-representation

One handle per prepared shot: a per-frame applier of shot-local seconds, the feed draw and an idempotent release; the roots stay in the scene under their mask names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hosts call apply before each frame, renderFeeds from the subject's beforeDraw, and dispose when the shot is retired; nothing else is exposed, and a reader finds a root by its name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No mutable graphic data is exposed; changing a picture means preparing the shot again.

# src/scene/surfaceGraphic/IAutoMovieSurfaceGraphicsObject.ts#IAutoMovieSurfaceGraphicsObject.apply

## @evidence contracts/development/common.md#meaningful-documentation

States which key each track shows at shot-local seconds, when to call it, and the refusal of a time outside the shot.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature has no body; the function that implements it answers.

# src/scene/surfaceGraphic/IAutoMovieSurfaceGraphicsObject.ts#IAutoMovieSurfaceGraphicsObject.renderFeeds

## @evidence contracts/development/common.md#meaningful-documentation

States what it draws into each shown feed target, when to call it, the one-level rule inside a feed, the restored render target, the refusal of an unresolved camera, and the film response a feed is drawn through under the optics passed with it.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature has no body; the function that implements it answers.

# src/scene/surfaceGraphic/IAutoMovieSurfaceGraphicsObject.ts#IAutoMovieSurfaceGraphicsObject.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what the call detaches and releases, feed render targets included, and that a second call does nothing.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature has no body; the function that implements it answers.
