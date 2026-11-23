# src/geometry/IAutoMoviePlanarCurveSource.ts#IAutoMoviePlanarCurveSource

## @evidence contracts/development/common.md#meaningful-documentation

Documents callback parameterization, exact one-sided derivatives at breaks, domain, breaks and coordinate snapshot ownership.

## @evidence contracts/development/design.md#principled-representation

The ordered domain and derivatives through order five support the Ahn and Ghosh conic methods and compact fitting; regularity is checked numerically by the selected algorithm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recovery accepts a pure evaluator so source basis and artifact I/O remain with existing owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interface accepts arbitrary planar source charts without a Human or polynomial-degree dependency.
