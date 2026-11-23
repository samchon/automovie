# src/geometry/curve/IAutoMovieCubicOval64.ts#IAutoMovieCubicOval64.IAxesBySimpsonResult

## @evidence contracts/development/common.md#meaningful-documentation

Positive millimetre breadth and depth are the diameters of one normalized cubic oval, with a dimensionless breadth/depth ratio. Scalar types do not enforce positivity or finiteness; axesBySimpson admits circumference and ratio before returning dimensions.

## @evidence contracts/development/design.md#principled-representation

Positive millimetre breadth and depth are the diameters of one normalized cubic oval, with a dimensionless breadth/depth ratio.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieCubicOval64.axesBySimpson publishes these dimensions after solving against its Simpson perimeter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scalar types do not enforce positivity or finiteness; axesBySimpson admits circumference and ratio before returning dimensions.
