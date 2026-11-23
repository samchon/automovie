# src/construction/IAutoMovieSolidClip.ts#IAutoMovieSolidClip

## @evidence contracts/development/design.md#principled-representation

IRailPoint couples a mesh vertex and radian blend phase with one or two face-local charts; across is absent at a crossing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidClip consumes this interface record while clipping and inserting the same shared rail vertices.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record permits arbitrary face counts structurally; crossing construction supplies the documented one/two incidence and unit-world-speed direction.

## @evidence contracts/development/common.md#meaningful-documentation

States mesh identity, chart ownership, phase order and crossing absence.

# src/construction/IAutoMovieSolidClip.ts#IAutoMovieSolidClip.IRailPoint

## @evidence contracts/development/design.md#principled-representation

Regular points belong to one face; a placed crossing shares one vertex between two chart readings so clipped face boundaries can refer to the same index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record couples the shared mesh index to per-face chart data and the optional side-probe direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two chart readings alone do not certify identical world positions; the crossing builder's finite bisection and atlas premises own that approximation.

## @evidence contracts/development/common.md#meaningful-documentation

Gives phase order, face-chart mapping and the absence of an across probe at crossings.
