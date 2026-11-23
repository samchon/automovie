# src/geometry/IAutoMovieMeshWinding.ts#IAutoMovieMeshWinding

## @evidence contracts/development/design.md#principled-representation

A dimensionless signed winding number and two Booleans derived from it and the surface test, for a point in the mesh's metre frame. The type cannot enforce that `inside` and `surface` are never both true; `createAutoMovieMeshWindingQuery` sets them so.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the engine's winding query. Built-space shell containment reads `surface` and `inside`; form checks, part contacts and Human probes read `inside` and `surface`, and `winding` lets a caller see a reversed or overlapping shell.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All three fields are required and plain; no optional field combines into a meaningless state, and no cast or widening is used.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the method and its citation, the frame and unit, what values the winding takes in closed, reversed, overlapping and holed shells, the surface slack, and the `inside` rule with its absolute value.
