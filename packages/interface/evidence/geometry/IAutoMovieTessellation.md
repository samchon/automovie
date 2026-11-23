# src/geometry/IAutoMovieTessellation.ts#IAutoMovieTessellation

## @evidence contracts/development/design.md#principled-representation

Three flat parallel arrays in the layout GPU vertex buffers and glTF attributes take, so exporters copy them without reshaping, and every index addresses one xyz triple of both `positions` and `normals`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The smallest mesh record a renderer can draw, kept apart from `IAutoMovieMesh` because primitive and surface tessellation never produce UVs, skins or a missing index buffer, so consumers need no null checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Producers emit the shape's own normals rather than leaving them for a consumer to guess, and the drawing pass refuses misaligned arrays instead of truncating them; one gap remains, the GLB exporter also fills this shape from an authored mesh with empty arrays standing for missing normals or indices.

## @evidence contracts/development/common.md#meaningful-documentation

States the producers, how it differs from `IAutoMovieMesh`, the unit and frame per producer, the array alignment, and its consumers.
