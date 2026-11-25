# src/construction/IAutoMovieSolidSurface.ts#IAutoMovieSolidSurface

## @evidence contracts/development/design.md#principled-representation

The operators read a smooth chart's exact 2-jets, period, orientation and domain; finite regular jets and compatible geometry remain caller premises, not facts certified by this interface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The basic chart has one jet function, period, orientation and domain. Optional direct point and range-bound readers expose the same chart for tessellation along its two axes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Intersection and G2 blending require the map's native differential. The prepared fan uses a documented local numerical jet to tessellate its owned continuous strip and reads the exact curve positions for the boundary and incidence checks.

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

# src/construction/IAutoMovieSolidSurface.ts#IAutoMovieSolidSurface.IFirst

## @evidence contracts/development/common.md#meaningful-documentation

The same world point and chart tangents as the full surface jet.

## @evidence contracts/development/design.md#principled-representation

Point and both derivatives derive from the existing total-order contract with its millimetre and chart units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native split strips provide one prepared column read for their first-order grid consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The first-order capability does not grant second partials or extend a surface's domain.
