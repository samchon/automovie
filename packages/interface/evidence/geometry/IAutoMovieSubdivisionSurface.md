# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface

## @evidence contracts/development/design.md#principled-representation

Packed glTF-style buffers with face-varying index arrays, the representation OpenSubdiv uses for refined surfaces, so attributes that are discontinuous only at seams or creases stay shared elsewhere.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Refined control positions, limit positions, quads, face-varying normals and UVs and per-vertex parameters, each a distinct product a caller asks for; no mesh conversion is imposed because seam splitting depends on which attributes the caller keeps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sharp features get one normal per sector instead of one averaged normal that would be wrong on every side.

## @evidence contracts/development/common.md#meaningful-documentation

States the vertex, edge and face ordering, the face-varying layout of normals and UVs, when a vertex has several normals, and how to turn the result into a render mesh.
