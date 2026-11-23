# src/drawing/IAutoMovieDrawingSpacePlace.ts#IAutoMovieDrawingSpacePlace

## @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawingSchedule` fills each field from one query: `builtEnvironmentBuildingOfSpace`, the space's own `parent`, `autoMovieDrawingSpaceBox`, `builtEnvironmentSpaceContentBounds`, `builtEnvironmentSpaceFidelity`, `builtEnvironmentSpaceNodes`, `builtEnvironmentAdjacentSpaces` and `builtEnvironmentSpaceConnectors`, sorting every id list with `compareAutoMovieRenderIds`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One place record gathers delegated hierarchy, box, content, adjacency and connector answers. Bounds are rounded and named contents truncated after sorting, while fidelity remains an authored metadata fold rather than an accuracy measurement; the record does not authenticate a source revision.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contents come from the declared `space` of elements and populations, never from id prefixes, and a population is named once by its owner id rather than expanded or sampled.

## @evidence contracts/development/common.md#meaningful-documentation

States the one-query-per-field rule and why two boxes exist; members give when each nullable field is `null`, the descendant folding of `content`, `fidelity` and `contents`, the id spellings and bound of `contents`, how to recover the full count, and the exact-match rule of `connectors`.
