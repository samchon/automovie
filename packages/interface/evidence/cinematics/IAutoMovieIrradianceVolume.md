# src/cinematics/IAutoMovieIrradianceVolume.ts#IAutoMovieIrradianceVolume

## @evidence contracts/development/design.md#principled-representation

A regular probe grid: origin in metres, pitch in metres, counts per axis and probes in a stated order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bake produces it, the CPU sampler and the renderer's uniforms read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Positions are not stored; they follow from origin, pitch and index.

## @evidence contracts/development/common.md#meaningful-documentation

States the index rule, units and order.
