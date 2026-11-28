# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input

## @evidence contracts/development/common.md#meaningful-documentation

The input names registered millimetre points, the original unit parameter chart, curve authority and all fitting, quadrature and refinement bounds.

## @evidence contracts/development/design.md#principled-representation

The chart combines private affine observation triangles with an initial rectangular partition and constrained Bernstein edge authorities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller owns the sources and shared curves. Leaf fitting consumes private observations and returns coefficient evidence.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result

## @evidence contracts/development/common.md#meaningful-documentation

The result separates output patches and controls from fit, source-area and refinement outcomes.

## @evidence contracts/development/design.md#principled-representation

Qualification depends on completed area observations and the joint geometric fit. The result retains explicit partial or unqualified diagnostics when a requested step cannot complete.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fit owns coefficients and observations of numerical support. Assembly owns publication of the generating atlas.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The callable boundary describes source topology, positioned curve controls, per-attempt qualification, and the work ceilings governing retained output.

## @evidence contracts/development/design.md#principled-representation

Point residual locations guide further leaf splits. Any accepted refinement keeps the closure partition valid and preserves original curve authority.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation owns fitting and refinement, while chart assembly and Engine realization own generated atlas and mesh publication.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.name

## @evidence contracts/development/common.md#meaningful-documentation

The local fit adds this prefix to patch IDs and to each registry binding's patch reference before returning the layout.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.verticesMm

## @evidence contracts/development/common.md#meaningful-documentation

The physical positions supply the chart enclosure, triangle area, and candidate rows for both area quadrature and point fallback.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.triangles

## @evidence contracts/development/common.md#meaningful-documentation

The source triangle population and its winding enter the area integration. Its length also supplies the pre-clipping quadrature row estimate.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.parameters

## @evidence contracts/development/common.md#meaningful-documentation

The area builder uses these original-vertex-aligned UV coordinates to clip triangles into leaves. The fallback locates vertices and triangle centroids with the same coordinates.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.curves

## @evidence contracts/development/common.md#meaningful-documentation

The overall qualification tests the supplied boundary fits' tolerance flags together with the joint solve. The record retains each completed fit's independent evidence.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.knots

## @evidence contracts/development/common.md#meaningful-documentation

The collar builder uses the four side knot lists to seed its partition before any retained split. Active boundary controls follow their existing oriented curve parameterization.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.toleranceMm

## @evidence contracts/development/common.md#meaningful-documentation

The joint solve and refinement trigger share the physical millimetre tolerance. Refinement examines retained rows over free support and the original objective-gap evidence.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.maxPatches

## @evidence contracts/development/common.md#meaningful-documentation

The same configured patch cap limits collar leaves and refinement closure. The separate coefficient budget is derived as sixteen slots per permitted patch.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.maxIterations

## @evidence contracts/development/common.md#meaningful-documentation

Each joint fit receives the configured attempt limit. Completed rounds record the actual iterations in the nested solve report.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.maxObservationRows

## @evidence contracts/development/common.md#meaningful-documentation

The bounded area sampler receives this row cap before the joint fit. An area-admission refusal can produce an explicitly recorded point fallback.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.maxRefinements

## @evidence contracts/development/common.md#meaningful-documentation

The fit attempts further splits only while the completed round index is below this ceiling and the residual, capacity and qualification gates allow refinement.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Input.physicalGradientLengthMm

## @evidence contracts/development/common.md#meaningful-documentation

The quadrature builder receives this physical length for derivative-row weighting alongside the position residual. Omission leaves that sampler's default behavior.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result.controlsMm

## @evidence contracts/development/common.md#meaningful-documentation

The returned vector population is the retained joint fit's physical controls, with patch slots addressing it by registry ID.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result.patches

## @evidence contracts/development/common.md#meaningful-documentation

Output patch IDs carry the chart prefix and refer to the canonical registry's sixteen U-fastest coordinate slots.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result.qualified

## @evidence contracts/development/common.md#meaningful-documentation

The output qualifies only when all supplied boundary curve fits meet tolerance and the joint chart solve qualifies.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result.joint

## @evidence contracts/development/common.md#meaningful-documentation

The nested report retains the selected joint fit's residuals, rank, work and optimality information even when the chart remains unqualified.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result.leafLayout

## @evidence contracts/development/common.md#meaningful-documentation

The output preserves the selected collar leaves and master registry edges. Each side binding rewrites its patch ID to the chart-scoped form.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result.areaObservation

## @evidence contracts/development/common.md#meaningful-documentation

The report distinguishes retained area quadrature from the point fallback and includes row counts, source area and any available integrated-area discrepancy.

# src/recovery/IAutoMovieRecoveryChartLeafFit.ts#IAutoMovieRecoveryChartLeafFit.Result.refinement

## @evidence contracts/development/common.md#meaningful-documentation

The retained candidate records its completed round and numerical support or stop findings. Rejected split attempts leave the prior valid candidate available.
