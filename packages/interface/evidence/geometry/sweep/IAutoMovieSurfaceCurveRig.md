# src/geometry/sweep/IAutoMovieSurfaceCurveRig.ts#IAutoMovieSurfaceCurveRig

## @evidence contracts/development/design.md#principled-representation

A curve compiled once and re-fitted through moved control points per pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One update and the three reads a cage needs: points, the bridge normal and the bridge direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reads before `update` see the previous pose.

## @evidence contracts/development/common.md#meaningful-documentation

States the call order.
