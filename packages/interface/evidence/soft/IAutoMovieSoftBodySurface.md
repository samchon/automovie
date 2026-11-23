# src/soft/IAutoMovieSoftBodySurface.ts#IAutoMovieSoftBodySurface

## @evidence contracts/development/design.md#principled-representation

softBodySurfaceGeometry emits two triangles per lattice quad, sums unnormalized incident cross products for area-weighted normals and maps UVs from normalized row/column coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The surface references its solved domain and step and keeps vertex indices identical to particle indices; the viewer consumes this engine-derived mesh.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A one-row or one-column cord emits no invented sliver triangles and has null surface bounds; degenerate normal sums use the documented up-vector fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Fields state triangulation, indexing, stable lattice UVs and bounds of indexed vertices rather than a particle-only cord extent.
