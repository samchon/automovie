# src/validation/IAutoMovieShotFontSources.ts#IAutoMovieShotFontSources

## @evidence contracts/development/common.md#meaningful-documentation

States which shot's list a row holds, what texture closure checks in it with the ledger, and why one row is one shot.

## @evidence contracts/development/design.md#principled-representation

The shot id names the list and the sources are the shot's own records, so closure admits them with the same rules font admission applies and ties an asset source to the ledger's `"font"` use by the source's id; font ids are unique within a shot, so rows keep shots apart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by `validateTextureAssets`; the caller copies each compiled shot's `fonts` list into a row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row carries no decoded font or bytes, which closure does not read.