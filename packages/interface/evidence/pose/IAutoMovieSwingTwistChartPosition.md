# src/pose/IAutoMovieSwingTwistChartPosition.ts#IAutoMovieSwingTwistChartPosition

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes dimensionless swing-disc coordinates from clinical-degree twist and notes that chart does not clamp.

## @evidence contracts/development/design.md#principled-representation

The legal swing region maps to the unit disc; twist uses the alias nearest the allowed degree interval. An outside rotation can yield coordinates outside these bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

swingTwistRange.chart supplies the coordinates read by placed and blend using the same constraint and joint frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The chart explicitly separates direction from axial rotation instead of treating three numbers as Euler angles.
