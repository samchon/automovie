# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.IMeasure

## @evidence contracts/development/common.md#meaningful-documentation

Readings of one seam point: what the declared continuity is judged on.

## @evidence contracts/development/design.md#principled-representation `gap`: Distance between the two pieces' points, mm. `angle`: Angle between tangents (curves) or normals (surfaces), radians. `curvature`: Jump of the curvature vector (curves) or of the normal curvature across the seam (surfaces), 1/mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanSeam.measureArc, AutoMovieHumanSeam.measure. Read by AutoMovieHumanSeam.violations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `gap`, `angle`, `curvature`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.ITolerance

## @evidence contracts/development/common.md#meaningful-documentation

Largest readings a declared continuity accepts.

## @evidence contracts/development/design.md#principled-representation `gap`: Largest gap, mm. `angle`: Largest angle, radians. `curvature`: Largest curvature jump, 1/mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanSeam.exact. Read by AutoMovieHumanSeam.violations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `gap`, `angle`, `curvature`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.ArcResult

## @evidence contracts/development/common.md#meaningful-documentation

Unit tangent and curvature vector of a curve from its first and second derivatives in any parameter: `T = d1 / |d1|` and `kappa N = (d2 - (d2 .

## @evidence contracts/development/design.md#principled-representation

Unit tangent and curvature vector of a curve from its first and second derivatives in any parameter: `T = d1 / |d1|` and `kappa N = (d2 - (d2 . Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeamConstruction.ArcResult is the canonical exchange used by AutoMovieHumanSeam.arc.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.arc for unit tangent and curvature vector of a curve from its first and second derivatives in any parameter: `T = d1 / |d1|` and `kappa N = (d2 - (d2 .

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.AdoptResult

## @evidence contracts/development/common.md#meaningful-documentation

A neighbour's parametric jet copied from an owner's arclength jet (J1): `q_v = lambda T` and `q_vv = lambda^2 kappa N + mu T`.

## @evidence contracts/development/design.md#principled-representation

A neighbour's parametric jet copied from an owner's arclength jet (J1): `q_v = lambda T` and `q_vv = lambda^2 kappa N + mu T`. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeamConstruction.AdoptResult is the canonical exchange used by AutoMovieHumanSeam.adopt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.adopt for a neighbour's parametric jet copied from an owner's arclength jet (J1): `q_v = lambda T` and `q_vv = lambda^2 kappa N + mu T`.

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.RibbonResult

## @evidence contracts/development/common.md#meaningful-documentation

Cross derivatives of a ribbon leaving an owner's surface across a seam (J4): `q_w = alpha D1 + beta c'` and `q_ww = alpha^2 D2 + 2 alpha beta d_t D1 + beta^2 c''`.

## @evidence contracts/development/design.md#principled-representation

Cross derivatives of a ribbon leaving an owner's surface across a seam (J4): `q_w = alpha D1 + beta c'` and `q_ww = alpha^2 D2 + 2 alpha beta d_t D1 + beta^2 c''`. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeamConstruction.RibbonResult is the canonical exchange used by AutoMovieHumanSeam.ribbon.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.ribbon for cross derivatives of a ribbon leaving an owner's surface across a seam (J4): `q_w = alpha D1 + beta c'` and `q_ww = alpha^2 D2 + 2 alpha beta d_t D1 + beta^2 c''`.

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.SquareMetric

## @evidence contracts/development/common.md#meaningful-documentation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.

## @evidence contracts/development/design.md#principled-representation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeamConstruction.SquareMetric is the canonical exchange used by AutoMovieHumanSeam.square.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.square for a chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.SquareCross

## @evidence contracts/development/common.md#meaningful-documentation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.

## @evidence contracts/development/design.md#principled-representation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeamConstruction.SquareCross is the canonical exchange used by AutoMovieHumanSeam.square.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.square for a chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.SquareAlong

## @evidence contracts/development/common.md#meaningful-documentation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.

## @evidence contracts/development/design.md#principled-representation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeamConstruction.SquareAlong is the canonical exchange used by AutoMovieHumanSeam.square.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.square for a chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.

# src/human/lofting/IAutoMovieHumanSeamConstruction.ts#IAutoMovieHumanSeamConstruction.SquareResult

## @evidence contracts/development/common.md#meaningful-documentation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.

## @evidence contracts/development/design.md#principled-representation

A chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeamConstruction.SquareResult is the canonical exchange used by AutoMovieHumanSeam.square.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.square for a chart direction leaving a curve on a surface square to it on the skin (J4 in the surface's chart): `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part along the curve removed in the metric of the skin, not of the chart.
