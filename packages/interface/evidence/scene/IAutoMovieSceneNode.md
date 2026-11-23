# src/scene/IAutoMovieSceneNode.ts#IAutoMovieSceneNode

## @evidence contracts/development/design.md#principled-representation

Stable placement binds a reusable model to world TRS and intended motion-or-pose state, with both null describing rest. Geometry/shot subject readers choose motion before held pose, while the current Production scene-artifact gate checks node identity, model reference and transform without admitting these two state fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

World placement and performed state remain node-owned while geometry, skeleton and material definitions stay on the referenced model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mutual exclusion and compatible rig/state remain caller obligations because the current scene-artifact gate does not inspect motion or pose. The low-level viewer scene builder applies neither field; its host owns posing and playback instead of claiming that graph construction performed them.

## @evidence contracts/development/common.md#meaningful-documentation

Defines placement/model identity, world transform, motion-versus-pose exclusivity and rest null semantics.
