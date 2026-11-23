# src/geometry/sweep/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface

## @evidence contracts/development/design.md#principled-representation

The queries a sampler, a bridge and a measurement need from a parametric surface: position, radius and its split into shape and scale, section frame, outward normal and the derivative along the spine.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record of closures over the compiled tables, so callers never repeat the compile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Section and frame queries clamp u while differential queries require u in [0,1]; the common number signature does not enforce that premise or distinguish polar and curve-parameter v.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, parameter ranges, clamping and wrapping, and each query's unit and direction.
