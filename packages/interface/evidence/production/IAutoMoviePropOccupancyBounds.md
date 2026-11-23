# src/production/IAutoMoviePropOccupancyBounds.ts#IAutoMoviePropOccupancyBounds.IProps

## @evidence contracts/development/design.md#principled-representation

Model-local footprint or part vertices are transformed to a world-axis box in metres. An explicit footprint wins; no measurable parts yield a degenerate box at the staged origin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

propOccupancyBounds supplies placement geometry checks from the prop registry and staged set piece, using shared box transforms and part measurement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An external appearance is represented by its registered deterministic proxy; no asset bytes are opened and no renderer pixel extent is inferred.

## @evidence contracts/development/common.md#meaningful-documentation

Registered prop geometry and staged placement used for world occupancy. Model-local footprint or part vertices are transformed to a world-axis box in metres. An explicit footprint wins; no measurable parts yield a degenerate box at the staged origin.
