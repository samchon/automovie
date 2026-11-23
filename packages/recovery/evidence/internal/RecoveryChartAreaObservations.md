# src/index.ts#RecoveryChartAreaObservations

## @evidence contracts/development/implementation.md#principled-implementation

Rectangle clipping preserves each source triangle's affine chart correspondence; positive Gauss weights observe interior Bernstein support even when every original vertex lies on the chart boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One observation owner supplies the existing shared-control fitter with area rows, without creating coefficients or generated faces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Interior observations come from the source, never from the candidate field; centroid counts and nonzero diagonal entries do not substitute for identifiability.

## @evidence contracts/development/common.md#meaningful-documentation

States polynomial integration premises, physical weight units, numerical limitations and private topology lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

For T source triangles, P tensor cells and K intersecting clipped child triangles, conservative cell-range lookup and clipping cost O(T(U+V)+TP) in the worst case and quadrature costs O(49K). The returned row count is 49K and is rejected before exceeding the explicit observation budget.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Tensor knots, fixed Gauss abscissas and each clipped polygon are reused for all child samples; source positions are evaluated affinely rather than refitted.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One clipped polygon is transient; the caller owns at most maxObservations returned rows, and all source references expire after the call.
