# src/model/import/IAutoMovieIngestResult.ts#IAutoMovieIngestResult

## @evidence contracts/development/design.md#principled-representation

Positional ids follow glTF's own index-based references, so a node, clip, mesh, camera or skin id derives from its index in the document's lists and cross-references resolve without name lookup under the mapper's graph-membership premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parsed-document mapper exposes only core nodes and clips, consumed by its import tests; production resident-byte inspection uses its separate report.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The documentation states that positional ids do not survive a re-export that reorders the lists rather than presenting them as content identity.

## @evidence contracts/development/common.md#meaningful-documentation

The comments give the id scheme for every referenced resource, the parent meaning of each node, and the order, looping and duration meaning of each clip.
