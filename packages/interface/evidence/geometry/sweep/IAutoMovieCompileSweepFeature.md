# src/geometry/sweep/IAutoMovieCompileSweepFeature.ts#IAutoMovieCompileSweepFeature

## @evidence contracts/development/common.md#meaningful-documentation

Metre spine length and mean metre radius define knot spacing in normalized u and radian angle. The compile-time and query metrics remain distinct; this helper assumes admitted scales and does not guarantee a global nearest course point.

## @evidence contracts/development/design.md#principled-representation

Metre spine length and mean metre radius define knot spacing in normalized u and radian angle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileAutoMovieSweep supplies IScale to compileAutoMovieSweepFeature; displacement queries use their own local radius metric.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The compile-time and query metrics remain distinct; this helper assumes admitted scales and does not guarantee a global nearest course point.

# src/geometry/sweep/IAutoMovieCompileSweepFeature.ts#IAutoMovieCompileSweepFeature.IScale

## @evidence contracts/development/design.md#principled-representation

Both scales are metres: length converts normalized u and radius converts radians to cylindrical distance; positivity and finiteness are caller preconditions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileAutoMovieSweep supplies path length and mean station radius to compileAutoMovieSweepFeature; query-local radius remains a separate displacement argument.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The metric is explicitly approximate for noncircular sections and contains no world-frame coordinates or pose state.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes compile-time knot spacing from query distance and states units, producer and lack of local validation.
