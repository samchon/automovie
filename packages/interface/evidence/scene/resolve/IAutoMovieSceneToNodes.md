# src/scene/resolve/IAutoMovieSceneToNodes.ts#IAutoMovieSceneToNodes.IProps

## @evidence contracts/development/design.md#principled-representation

The staged scene and optional model/prop registries define rest-placement node lowering, with explicit partial-model permission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

sceneToNodes uses existing scene, model and prop contracts; composeScene separately owns graph id, parent and cycle admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Partial registries preserve placements but omit unregistered subtrees only when explicitly allowed; this cannot claim complete model expansion.

## @evidence contracts/development/common.md#meaningful-documentation

Documents registry identity, omitted-registry behavior and partial lowering ownership.
