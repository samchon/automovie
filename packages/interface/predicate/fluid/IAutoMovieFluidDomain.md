# src/fluid/IAutoMovieFluidDomain.ts#IAutoMovieFluidDomain

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies metre units, +X/+Z row-major cells, authored depths and a zero initial velocity. It names the caller's admission step and the separate arithmetic limits during simulation and projection.

## @evidence contracts/development/design.md#principled-representation

Version and units are fixed literals. Cell data, boundaries, flows and the solver have separate typed roles. validateFluidDomain establishes array lengths, finite values, flow-site validity and the design-depth Courant bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A domain carries the reusable fluid computation. IAutoMovieWaterFeature owns the optional architectural binding, while simulation and projection consume the grid and state without housing terms.
