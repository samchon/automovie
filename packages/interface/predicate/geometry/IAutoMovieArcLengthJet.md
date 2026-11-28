# src/geometry/IAutoMovieArcLengthJet.ts#IAutoMovieArcLengthJet

## @evidence contracts/development/common.md#meaningful-documentation

Curve point and derivatives in the chosen increasing millimetre arc-length direction.

## @evidence contracts/development/design.md#principled-representation

Seam publication projects the second parameter derivative perpendicular to the tangent and divides by squared speed on regular curves. Its zero-speed convention publishes a zero tangent and retains the second input derivative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result owns mutable coordinate arrays in the same source chart. The source parameter and incident chart orientation remain with the publisher.

# src/geometry/IAutoMovieArcLengthJet.ts#IAutoMovieArcLengthJet.point

## @evidence contracts/development/common.md#meaningful-documentation

Published point in millimetres in the shared chart, with the same dimension as the derivative arrays.

# src/geometry/IAutoMovieArcLengthJet.ts#IAutoMovieArcLengthJet.tangent

## @evidence contracts/development/common.md#meaningful-documentation

Unit tangent along increasing arc length for a regular curve. A zero source derivative publishes the zero tangent.

# src/geometry/IAutoMovieArcLengthJet.ts#IAutoMovieArcLengthJet.curvature

## @evidence contracts/development/common.md#meaningful-documentation

Regular second arc-length derivative in inverse millimetres and perpendicular to the tangent. At zero source speed this field retains the source second derivative as a diagnostic value.
