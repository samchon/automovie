# src/validation/IAutoMovieSurfaceGraphicImageUse.ts#IAutoMovieSurfaceGraphicImageUse

## @evidence contracts/development/common.md#meaningful-documentation

States which shot, model and image id one use names and how texture closure resolves it.

## @evidence contracts/development/design.md#principled-representation

The shot id is the ledger consumer identity and the model id scopes carried images, so closure can tell a carried image from a project file without reading the scene.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by `validateTextureAssets`; the caller flattens its shots' image layers into these rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row carries no layer geometry or fit, which closure does not check.
