# src/recovery/IAutoMovieRecoverySectionsInput.ts#IAutoMovieRecoverySectionsInput

## @evidence contracts/development/common.md#meaningful-documentation

The request combines an existing triangle mesh and cutting basis with distinct station coordinates, optional terminal seeds and optional source slab observations.

## @evidence contracts/development/design.md#principled-representation

The caller owns the exact slicing stations. An optional seed can extend the observed request to source-derived terminal brackets, while slab pairs consume actual cut-emitting lineage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies registered geometry and fitting policy. The observer chooses and reports per-station fitted outcomes and emits provenance on its explicit callback boundary.

# src/recovery/IAutoMovieRecoverySectionsInput.ts#IAutoMovieRecoverySectionsInput.name

## @evidence contracts/development/common.md#meaningful-documentation

Each emitted curve name incorporates this name, its station coordinate and original observed contour ordinal.

# src/recovery/IAutoMovieRecoverySectionsInput.ts#IAutoMovieRecoverySectionsInput.coordinatesMm

## @evidence contracts/development/common.md#meaningful-documentation

The observer retains requested order and rejects duplicate coordinates. Derived terminal coordinates, when requested, follow that original prefix.

# src/recovery/IAutoMovieRecoverySectionsInput.ts#IAutoMovieRecoverySectionsInput.terminalSeeds

## @evidence contracts/development/common.md#meaningful-documentation

A seed must name a requested plane and a published closed loop. The trace can append source event coordinates and brackets.

# src/recovery/IAutoMovieRecoverySectionsInput.ts#IAutoMovieRecoverySectionsInput.slabPairs

## @evidence contracts/development/common.md#meaningful-documentation

Both bounds must be requested stations, and the observer retains the original supplied pair order while gathering exact cut-emitting faces.

# src/recovery/IAutoMovieRecoverySectionsInput.ts#IAutoMovieRecoverySectionsInput.includeExactSourceLineage

## @evidence contracts/development/common.md#meaningful-documentation

The cut enables exact provenance when requested or when source slab observation needs it to bind ports.
