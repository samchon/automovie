# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge

## @evidence contracts/development/common.md#meaningful-documentation

The occurrence retains its original face, clipped cell, ordered nodes and edge identity, along with scalar role and physical-boundary qualification.

## @evidence contracts/development/design.md#principled-representation

Use one record per face-local directed edge. A declared original edge can share an incidence key, while a face-local cut edge keeps its own occurrence identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Occurrence construction owns raw direction and address evidence. Topology assigns the connected component, and port binding uses that existing occurrence population.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.id

## @evidence contracts/development/common.md#meaningful-documentation

The topology builder creates one such key for every directed edge of a dimension-two cell.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.cell

## @evidence contracts/development/common.md#meaningful-documentation

Each occurrence is indexed by its own cell for boundary and port queries.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.face

## @evidence contracts/development/common.md#meaningful-documentation

The occurrence copies this value directly from the clipped source cell.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.from

## @evidence contracts/development/common.md#meaningful-documentation

The producer preserves the clipped polygon's stored point direction.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.to

## @evidence contracts/development/common.md#meaningful-documentation

The successor in the original clipped cell supplies the end address.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.edge

## @evidence contracts/development/common.md#meaningful-documentation

Keys on original source edges use canonical endpoint pairs in canonical mode. Other cut occurrences are face-local.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.side

## @evidence contracts/development/common.md#meaningful-documentation

Equal lower or upper scalar endpoints select before or after. Other occurrences use the physical role.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.physicalBoundary

## @evidence contracts/development/common.md#meaningful-documentation

Physical ports require this flag even when an occurrence's scalar role is before or after.

# src/recovery/IAutoMovieRecoverySourceHalfedge.ts#IAutoMovieRecoverySourceHalfedge.component

## @evidence contracts/development/common.md#meaningful-documentation

The topology stage assigns each occurrence after joining cells over shared edge incidence.
