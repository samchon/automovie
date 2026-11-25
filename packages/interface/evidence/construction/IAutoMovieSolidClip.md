# src/construction/IAutoMovieSolidClip.ts#IAutoMovieSolidClip.IRailPoint

## @evidence contracts/development/design.md#principled-representation

Regular points belong to one face; a placed crossing shares one vertex between two chart readings so clipped face boundaries can refer to the same index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record couples the shared mesh index to per-face chart data and the optional side-probe direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two chart readings alone do not certify identical world positions; the crossing builder's finite bisection and atlas premises own that approximation.

## @evidence contracts/development/common.md#meaningful-documentation

Gives phase order, face-chart mapping and the absence of an across probe at crossings.
