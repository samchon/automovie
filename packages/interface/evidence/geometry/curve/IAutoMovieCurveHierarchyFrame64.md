# src/geometry/curve/IAutoMovieCurveHierarchyFrame64.ts#IAutoMovieCurveHierarchyFrame64

## @evidence contracts/development/design.md#principled-representation

Explicit local transforms permit world composition before any dependent controls are generated.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A node key, parent key and one rigid transform define each hierarchy entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record adds no scale, reflection repair or anatomy-specific bone semantics.

## @evidence contracts/development/common.md#meaningful-documentation

States local-to-parent direction, translation units and input ordering.
