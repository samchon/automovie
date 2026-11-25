# src/render/IAutoMovieSealRenderTarget.ts#IAutoMovieSealRenderTarget.IProps

## @evidence contracts/development/design.md#principled-representation

Renderer identity, buffer/settings values and asset byte digests bind a reproducible target; optional textureDigest adds host-decoded upload facts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

sealAutoMovieRenderTarget uses canonical renderer/settings/asset records and normalizes asset order before hashing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Runtime admission rejects invalid numeric settings, duplicate paths and malformed digests; structural policy/boolean shapes remain caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Documents hash ordering, optional texture facts and admission ownership.
