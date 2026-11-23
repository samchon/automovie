# src/human/generation/limb/IAutoMovieHumanNamedSource.ts#IAutoMovieHumanNamedSource

## @evidence contracts/development/common.md#meaningful-documentation

An actual named builder result, retained even when part or loft admission failed.

## @evidence contracts/development/design.md#principled-representation `name`: The requested anatomical name, also available when the result has no part. `result`: The identical result produced by the source builder; no replacement loft is made.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodyTree.massFold, AutoMovieHumanTrunkBuild.masses. Also types AutoMovieHumanBodyLane.sources, AutoMovieHumanTrunkBuild.sources.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `result`; callers supply the complete record.
