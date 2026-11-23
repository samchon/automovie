# src/geometry/sweep/IAutoMovieInterpolateSpline.ts#IAutoMovieInterpolateSpline

## @evidence contracts/development/common.md#meaningful-documentation

Scalar knots and values retain caller units; optional period defines a wrapped rather than open chart. The sampled overshoot policy does not guarantee positive interpolation from positive data; radius and scale owners must admit results.

## @evidence contracts/development/design.md#principled-representation

Scalar knots and values retain caller units; optional period defines a wrapped rather than open chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interpolateAutoMovieSpline copies IProps into the shared tension-spline compiler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sampled overshoot policy does not guarantee positive interpolation from positive data; radius and scale owners must admit results.

# src/geometry/sweep/IAutoMovieInterpolateSpline.ts#IAutoMovieInterpolateSpline.IProps

## @evidence contracts/development/design.md#principled-representation

Ordered finite knots and matched finite ordinates carry independent caller-selected units; interpolateAutoMovieSpline checks them before fitting copied arrays.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sweep sections, scales, feature values and girth factors share this scalar contract while their consumers own result positivity admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A sampled tension search does not become a strict overshoot or positivity guarantee; period absence has the concrete meaning of open endpoint extension.

## @evidence contracts/development/common.md#meaningful-documentation

Explains copied inputs, period bounds, constant/linear cases, continuity and the limits of the overshoot policy.
