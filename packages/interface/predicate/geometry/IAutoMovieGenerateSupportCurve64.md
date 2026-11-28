# src/geometry/IAutoMovieGenerateSupportCurve64.ts#IAutoMovieGenerateSupportCurve64.IProps.harmonics

## @evidence contracts/development/common.md#meaningful-documentation

The property states the number of authored coefficient pairs, the angular formula and the special requirements on index zero.

# src/geometry/IAutoMovieGenerateSupportCurve64.ts#IAutoMovieGenerateSupportCurve64.IHarmonic

## @evidence contracts/development/common.md#meaningful-documentation

The coefficient pair identifies cosine and sine amplitudes in millimetres at the array index and describes the zeroth harmonic's perimeter role.

## @evidence contracts/development/design.md#principled-representation

The generator checks a whole power-of-two span count and copies finite coefficient pairs. It qualifies positive curvature and refuses nonfinite perimeter, remainder or control coordinates before returning the curve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input pair holds two amplitudes. Index and curve partition stay in their containing list and request.

# src/geometry/IAutoMovieGenerateSupportCurve64.ts#IAutoMovieGenerateSupportCurve64.IHarmonic.cosine

## @evidence contracts/development/common.md#meaningful-documentation

The cosine amplitude uses millimetres, with the zeroth amplitude supplying a positive analytic perimeter scale.

# src/geometry/IAutoMovieGenerateSupportCurve64.ts#IAutoMovieGenerateSupportCurve64.IHarmonic.sine

## @evidence contracts/development/common.md#meaningful-documentation

The sine amplitude uses millimetres and is zero at index zero.
