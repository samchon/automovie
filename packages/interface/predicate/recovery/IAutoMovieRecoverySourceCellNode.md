# src/recovery/IAutoMovieRecoverySourceCellNode.ts#IAutoMovieRecoverySourceCellNode

## @evidence contracts/development/common.md#meaningful-documentation

A node records its raw identity, selected incidence identity, source vertex or edge addresses and signed scalar value.

## @evidence contracts/development/design.md#principled-representation

Existing corners keep one original vertex ID. Intersections keep both source edge endpoints and their cut plane, preserving abstract topology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The clipper owns raw node identities. The selected alias policy controls joining without moving the source mesh.

# src/recovery/IAutoMovieRecoverySourceCellNode.ts#IAutoMovieRecoverySourceCellNode.id

## @evidence contracts/development/common.md#meaningful-documentation

At a cut crossing, the key includes both original vertex IDs and the exact clipped scalar plane.

# src/recovery/IAutoMovieRecoverySourceCellNode.ts#IAutoMovieRecoverySourceCellNode.incidenceId

## @evidence contracts/development/common.md#meaningful-documentation

The clipper substitutes the prepared endpoint address function only for this incidence identity.

# src/recovery/IAutoMovieRecoverySourceCellNode.ts#IAutoMovieRecoverySourceCellNode.vertices

## @evidence contracts/development/common.md#meaningful-documentation

The clipper derives the crossing's unique endpoints from the two adjacent raw corner records.

# src/recovery/IAutoMovieRecoverySourceCellNode.ts#IAutoMovieRecoverySourceCellNode.scalar

## @evidence contracts/development/common.md#meaningful-documentation

Original corners copy their authored source height and crossings carry the exact clipping plane level.
