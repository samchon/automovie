# src/production/IAutoMovieWorldHeightfield.ts#IAutoMovieWorldHeightfield.IInput

## @evidence contracts/development/design.md#principled-representation

Origin/spacing and callback coordinates use world XZ metres, and height answers world Y metres. Columns/rows must be safe integers at least two and spacing finite positive; worldHeightfield checks these before sampling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

worldHeightfield consumes height only to bake row-major samples into IAutoMovieWorldSurface; the resulting surface stores no callback or host handle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The polygon is cloned but not geometrically admitted here. Determinism, allocation feasibility and representable derived sample coordinates remain caller obligations; callback errors stop baking without retry.

## @evidence contracts/development/common.md#meaningful-documentation

Finite lattice baking inputs for a sampled world-height surface. Origin/spacing and callback coordinates use world XZ metres, and height answers world Y metres. Columns/rows must be safe integers at least two and spacing finite positive; worldHeightfield checks these before sampling.
