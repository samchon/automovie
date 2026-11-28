# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection

## @evidence contracts/development/common.md#meaningful-documentation

Discriminated closed curve types for a local sweep section in metres.

## @evidence contracts/development/design.md#principled-representation

The direction sampler derives a polar radius for star-shaped section curves, while the parameter evaluator supports the section's own closed curve order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each variant owns the controls its evaluator needs. Sweep correspondence, station placement and interpolation live outside the section.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IQuadrantExponents

## @evidence contracts/development/common.md#meaningful-documentation

Four exponent values in counterclockwise superellipse quadrant order.

## @evidence contracts/development/design.md#principled-representation

The evaluator chooses the quadrant exponent from the parameter angle and raises the two signed trigonometric magnitudes to 2 divided by that value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Quadrant exponent inputs stay separate from the signed half-axes and centre placement.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IQuadrantExponents.upperRight

## @evidence contracts/development/common.md#meaningful-documentation

Finite exponent in [1, 20] for the positive X, positive Y quadrant.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IQuadrantExponents.upperLeft

## @evidence contracts/development/common.md#meaningful-documentation

Finite exponent in [1, 20] for the negative X, positive Y quadrant.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IQuadrantExponents.lowerLeft

## @evidence contracts/development/common.md#meaningful-documentation

Finite exponent in [1, 20] for the negative X, negative Y quadrant.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IQuadrantExponents.lowerRight

## @evidence contracts/development/common.md#meaningful-documentation

Finite exponent in [1, 20] for the positive X, negative Y quadrant.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

One pair of local section coordinates measured from the spine point in metres.

## @evidence contracts/development/design.md#principled-representation

Section evaluation uses X and Y on the plane axes and places the lifted point from the section frame's origin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The coordinate pair needs only chart components, while the enclosing frame supplies model placement.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPoint.x

## @evidence contracts/development/common.md#meaningful-documentation

Metres along the section's first axis from the spine point.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPoint.y

## @evidence contracts/development/common.md#meaningful-documentation

Metres along the section's second axis from the spine point.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse

## @evidence contracts/development/common.md#meaningful-documentation

Four positive signed-axis extents, four exponents and an optional centre for one closed superellipse.

## @evidence contracts/development/design.md#principled-representation

The evaluator uses signed powers of sine and cosine by quadrant with shared axis intercepts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant supplies an analytic curve from axes, exponents and centre. Samples and stations are managed by the consumer.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse.type

## @evidence contracts/development/common.md#meaningful-documentation

Selects analytic superellipse quadrant evaluation.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse.right

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite distance from the centre to the positive X intercept, in metres.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse.up

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite distance from the centre to the positive Y intercept, in metres.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse.left

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite distance from the centre to the negative X intercept, in metres.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse.down

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite distance from the centre to the negative Y intercept, in metres.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse.exponents

## @evidence contracts/development/common.md#meaningful-documentation

Quadrant powers in counterclockwise order. Two gives an ellipse and higher values round toward a rectangle corner.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse.centre

## @evidence contracts/development/common.md#meaningful-documentation

Optional finite local XY centre in metres. Omission places it at the spine point.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBSpline

## @evidence contracts/development/common.md#meaningful-documentation

Closed uniform cubic B-spline described by a cyclic control polygon.

## @evidence contracts/development/design.md#principled-representation

The evaluator takes a four-point uniform cubic basis per equal parameter span and wraps controls around the seam.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant owns only cyclic controls. Knot repetition and sampling are derived.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBSpline.type

## @evidence contracts/development/common.md#meaningful-documentation

Selects closed uniform cubic B-spline evaluation.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBSpline.points

## @evidence contracts/development/common.md#meaningful-documentation

At least three finite section-plane controls in cyclic order, with the closing connection implicit.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBezier

## @evidence contracts/development/common.md#meaningful-documentation

Closed piecewise cubic B?zier with one anchor and two handle entries per segment.

## @evidence contracts/development/design.md#principled-representation

The evaluator uses the anchor, outgoing handle, incoming handle and following anchor for each cubic, wrapping the final anchor to the first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant stores one compact cyclic control run and derives segment count from its length.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBezier.type

## @evidence contracts/development/common.md#meaningful-documentation

Selects periodic piecewise cubic B?zier evaluation.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBezier.points

## @evidence contracts/development/common.md#meaningful-documentation

Finite control entries in triples of anchor, outgoing handle and next anchor's incoming handle, with a positive number of segments.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPolygon

## @evidence contracts/development/common.md#meaningful-documentation

Closed simple polygon with explicit corners joined by straight sides.

## @evidence contracts/development/design.md#principled-representation

Parameter evaluation assigns one equal span per side and preserves each authored corner at its exact span boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant stores cyclic corner coordinates. The evaluator derives edges without repeating the first corner.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPolygon.type

## @evidence contracts/development/common.md#meaningful-documentation

Selects piecewise-linear polygon evaluation.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPolygon.points

## @evidence contracts/development/common.md#meaningful-documentation

At least three finite corners in boundary order. Supply a simple loop with implicit closure.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IRadial

## @evidence contracts/development/common.md#meaningful-documentation

Closed section represented by positive metre radii sampled at even polar directions.

## @evidence contracts/development/design.md#principled-representation

Direction sampling interpolates the cyclic input with the sweep tension spline and checks queried radii against zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant stores one scalar per angle. The uniform angular grid and wrapped interpolation are derived by the consumer.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IRadial.type

## @evidence contracts/development/common.md#meaningful-documentation

Selects radii-by-direction evaluation.

# src/geometry/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IRadial.radii

## @evidence contracts/development/common.md#meaningful-documentation

At least three positive finite metre radii at angles 2?k divided by sample count, starting on the positive first axis.
