# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel

## @evidence contracts/development/design.md#principled-representation

Positions are vertex data and UVs and parameters are face-varying data, the split OpenSubdiv makes, so each refines by its own rule over the same topology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Everything one refinement step reads and writes, in flat arrays aligned with the topology's vertices and corners; `cage` marks the only level whose non-quad faces need the sub-face parameter split.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

UVs are either fully present or `null` together with their corner indices.

## @evidence contracts/development/common.md#meaningful-documentation

States why parameters are per corner, the meaning of `-1`, and the alignment of every array.
