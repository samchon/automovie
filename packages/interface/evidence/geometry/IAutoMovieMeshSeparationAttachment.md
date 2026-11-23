# src/geometry/IAutoMovieMeshSeparationAttachment.ts#IAutoMovieMeshSeparationAttachment

## @evidence contracts/development/design.md#principled-representation

The query recomputes the seat from the original binary64 corners with `interpolateAutoMovieTrianglePoint`, rounds it to Float32 for that representation, and requires the root to equal it exactly, so a registration cannot claim a seat its root does not occupy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields, the seat triangle, its weights and the incident supports, are what a hair curve already knows from sampling its root, so the query needs no adjacency of its own to decide which faces may touch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supports are verified by exact corner incidence rather than trusted, and the root is compared without tolerance, so no face is exempted by proximity or by a caller's say-so alone.

## @evidence contracts/development/common.md#meaningful-documentation

States the root convention, the weight order, what the active support is, the admission conditions and refusals, and why an incomplete support list fails safe.
