# src/geometry/IAutoMovieCubicOval64.ts#IAutoMovieCubicOval64.IAxesBySimpsonResult

## @evidence contracts/development/common.md#meaningful-documentation

Breadth and depth in millimetres for a cubic oval with supplied finite positive girth and aspect ratio.

## @evidence contracts/development/design.md#principled-representation

The solver normalizes its largest diameter to one, measures that oval with Simpson quadrature and multiplies each normalized diameter by the same girth scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result provides two independent support separations. The caller retains the requested perimeter, ratio and oriented chart.

# src/geometry/IAutoMovieCubicOval64.ts#IAutoMovieCubicOval64.IAxesBySimpsonResult.breadthMm

## @evidence contracts/development/common.md#meaningful-documentation

Lateral support separation in millimetres for the normalized-and-scaled cubic oval.

# src/geometry/IAutoMovieCubicOval64.ts#IAutoMovieCubicOval64.IAxesBySimpsonResult.depthMm

## @evidence contracts/development/common.md#meaningful-documentation

Anterior-to-posterior support separation in millimetres for the same cubic oval.
