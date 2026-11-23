# src/fluid/IAutoMovieFluidSurface.ts#IAutoMovieFluidSurface

## @evidence contracts/development/design.md#principled-representation

fluidSurfaceGeometry places one vertex per cell at origin.y + bed + depth, derives finite-difference normals and triangulates only quads with four wet, nonsolid cells. The supplied state must match the admitted domain's array layout; a matching id alone does not validate those arrays, and extreme derived sums, slopes or normal arithmetic have no separate finite-result gate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The surface reuses the shared `IAutoMovieMesh` shape and adds only the domain, the step, the drawn extent and the per-vertex flow, which are the facts a viewer needs beyond plain geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Dry vertices retain cell-index correspondence, while bounds reads only emitted triangle indices. Float32 upload is a numerical projection rather than exact-value or visual proof, and the stock viewer material does not consume flow for ripples.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the derivation and mismatch refusal, admitted-array and arithmetic limits, Float32 viewer projection, indexed drawn bounds, vertex/triangle/normal/UV conventions and unconsumed flow metadata.
