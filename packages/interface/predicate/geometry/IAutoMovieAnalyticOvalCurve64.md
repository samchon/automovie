# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64

## @evidence contracts/development/common.md#meaningful-documentation

The ellipse documents its millimetre frame and positive U and V directions of one-turn traversal.

## @evidence contracts/development/design.md#principled-representation

Validation requires finite centre and axes, orthonormality within its tolerance, positive finite radii and true closure. Evaluation refuses nonfinite phase and nonfinite produced points or tangents before returning the analytic observation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The analytic oval owns one centre, two directions and two radii. Its phase chart requires no coefficient partition.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.type

## @evidence contracts/development/common.md#meaningful-documentation

The literal selects the analytic oval validation and evaluation branch.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.name

## @evidence contracts/development/common.md#meaningful-documentation

The nonblank identity is preserved for attribution and inspection.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.closed

## @evidence contracts/development/common.md#meaningful-documentation

True records the required closed topology of this representation.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.unit

## @evidence contracts/development/common.md#meaningful-documentation

The millimetre literal applies to the centre and both semiaxes.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.phaseUnit

## @evidence contracts/development/common.md#meaningful-documentation

The turn literal defines the domain from zero to one and the derivative's independent unit.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.center

## @evidence contracts/development/common.md#meaningful-documentation

The readonly XYZ value locates the centre in source millimetres.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.u

## @evidence contracts/development/common.md#meaningful-documentation

The first unit axis points toward the zero-turn endpoint and is orthogonal to v.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.v

## @evidence contracts/development/common.md#meaningful-documentation

The second unit axis points toward the quarter-turn point and is orthogonal to u.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.radiusU

## @evidence contracts/development/common.md#meaningful-documentation

The positive finite U semiaxis scales the cosine component in millimetres.

# src/geometry/IAutoMovieAnalyticOvalCurve64.ts#IAutoMovieAnalyticOvalCurve64.radiusV

## @evidence contracts/development/common.md#meaningful-documentation

The positive finite V semiaxis scales the sine component in millimetres.
