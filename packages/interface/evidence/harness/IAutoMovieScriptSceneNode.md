# src/harness/IAutoMovieScriptSceneNode.ts#IAutoMovieScriptSceneNode

## @evidence contracts/development/design.md#principled-representation

An inner node whose slug scopes its subtree: `beatCaptions` passes the nearest scene's slug down the walk, so a beat is labelled by the scene that contains it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared node fields plus the `scene` discriminator and the slug payload; the staged set is a separate scene record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No stage derives a set, light or camera from the slug; it is authoring text.

## @evidence contracts/development/common.md#meaningful-documentation

States the allowed parents and the two readers of its slug, including how the caption label is inherited; members give the discriminator and payload roles.
