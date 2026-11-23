# src/harness/IAutoMovieScenePayload.ts#IAutoMovieScenePayload

## @evidence contracts/development/design.md#principled-representation

Follows the screenplay slug convention of interior or exterior, location and time of day, so one formatter produces the heading every reader of the tree shows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three slug fields and one optional prose line; the staged set the scene plays on is a separate record, so this payload stays authoring text.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Location and time of day are free text with no vocabulary the engine interprets; nothing derives lighting or a set from them.

## @evidence contracts/development/common.md#meaningful-documentation

States the slug format, its three readers, and the stored-record refusals; members give each field's role and the meaning of `null`.
