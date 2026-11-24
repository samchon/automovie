# src/cinematics/IAutoMovieSurfaceGraphicTrack.ts#IAutoMovieSurfaceGraphicTrack

## @evidence contracts/development/common.md#meaningful-documentation

States the node and surface identity, the reading frame the graphic is laid out in, the shot-local key clock with its opening key and inclusive key time, every admission refusal and the articulated-surface exclusion with its reopening condition.

## @evidence contracts/development/design.md#principled-representation

A scene node plus a model-scoped affordance id identifies one face of one placed prop, so the picture follows the prop's placement and motion; strictly increasing shot-local seconds select whole graphics by the last applicable key, with no interpolation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The track owns identity and timing; the face's frame and extents stay on the model's affordance and the picture on `IAutoMovieSurfaceGraphic`. `performShot` admits it, `validateShotArtifact` checks its shape, `render` draws it and the mask derivation reads it through `IAutoMovieRenderSubject`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Engine admission refuses an unregistered surface, a surface without extents, a duplicate node and surface pair, a malformed key clock and an articulated surface rather than guessing a frame; practical surface tracks stay a separate list for part materials.
