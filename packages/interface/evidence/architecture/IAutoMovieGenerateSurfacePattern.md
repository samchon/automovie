# src/architecture/IAutoMovieGenerateSurfacePattern.ts#IAutoMovieGenerateSurfacePattern.IProps

## @evidence contracts/development/design.md#principled-representation

Pattern coordinates are planar U/V metres and angles are degrees; generateAutoMovieSurfacePattern checks declaration geometry, safe lattice bounds and candidate reach before emitting placements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The single pattern member reuses IAutoMovieSurfacePattern, including its generator contract; the engine owns placement and quantity calculation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Generator purity is a caller premise and callback exceptions propagate; geometric admission throws while quality findings are returned, and callbacks are not retained.

## @evidence contracts/development/common.md#meaningful-documentation

Authored planar pattern and synchronous zone generators consumed by deterministic surface laying. Pattern coordinates are planar U/V metres and angles are degrees; generateAutoMovieSurfacePattern checks declaration geometry, safe lattice bounds and candidate reach before emitting placements.
