# src/geometry/AutoMovieCubicBezierControls3.ts#AutoMovieCubicBezierControls3

## @evidence contracts/development/common.md#meaningful-documentation

Read-only view of four ordered XYZ Bernstein controls for one cubic span in its owning chart.

## @evidence contracts/development/design.md#principled-representation

The cubic evaluates through the first and last controls and uses the two interior handles to shape the curve and its derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four triples fix cubic degree while retaining the caller's coefficient units, including derivative-control fields.
