# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology

## @evidence contracts/development/common.md#meaningful-documentation

The topology report distinguishes incidence counts, Euler characteristic, manifold and orientation evidence, boundary cycles and qualified genus.

## @evidence contracts/development/design.md#principled-representation

Counts use canonical incidence when selected. Euler and genus depend separately on simple cells, manifold links, orientability and a resolved cycle population.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This report measures clipped source incidence. Later chart and reconstruction admission decide whether this component can be represented by geometry.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.vertices

## @evidence contracts/development/common.md#meaningful-documentation

Topology canonicalizes each raw node under the selected address policy before counting incident vertices.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.edges

## @evidence contracts/development/common.md#meaningful-documentation

An original edge shares its declared key, while an interior cut from one face retains that face's occurrence key.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.faces

## @evidence contracts/development/common.md#meaningful-documentation

Only dimension-two cells enter the connected component and its face count.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.euler

## @evidence contracts/development/common.md#meaningful-documentation

The measurer subtracts distinct edge keys from distinct vertex IDs and adds the component cell count only when every cell is simple.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.manifold

## @evidence contracts/development/common.md#meaningful-documentation

Repeated cell vertices, over-shared edges and nonmanifold vertex links are evaluated from the original incidence population.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.orientable

## @evidence contracts/development/common.md#meaningful-documentation

The measurer propagates direction parity across edge incidences and reports obstruction separately from nonmanifold cases.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.inputOrientationConsistent

## @evidence contracts/development/common.md#meaningful-documentation

The input winding evidence is tracked separately from whether a consistent flip assignment exists.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.boundaryCycles

## @evidence contracts/development/common.md#meaningful-documentation

Boundary occurrence groups with a non-cycle link remain unresolved and do not add to this count.

# src/recovery/IAutoMovieRecoverySourceTopology.ts#IAutoMovieRecoverySourceTopology.genus

## @evidence contracts/development/common.md#meaningful-documentation

The producer computes (2 minus boundary cycles minus Euler) divided by two only for a manifold orientable component with resolved boundary.
