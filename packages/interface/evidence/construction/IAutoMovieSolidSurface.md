# src/construction/IAutoMovieSolidSurface.ts#IAutoMovieSolidSurface

## @evidence contracts/development/design.md#principled-representation

The operators read a smooth chart's exact 2-jets, period, orientation and domain; finite regular jets and compatible geometry remain caller premises, not facts certified by this interface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One jet function and three properties.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The jets must be the map's own; finite differences would break the trace and the G2 blend.

## @evidence contracts/development/common.md#meaningful-documentation

States the chart, the jet, the orientation rule and the domain.

# src/construction/IAutoMovieSolidSurface.ts#IAutoMovieSolidSurface.IJet

## @evidence contracts/development/design.md#principled-representation

The six-vector 2-jet represents a smooth two-parameter map, including one symmetric mixed partial for its curvature calculations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Named p/u/v/uu/uv/vv fields expose the exact orders consumed by Foot, Intersection and Ribbon without storing sampled neighbourhoods.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record asserts derivative meaning but cannot prove finiteness, mixed-partial consistency or a nonzero tangent cross product.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies world space, derivative units and the producer-specific ownership of the vectors.
