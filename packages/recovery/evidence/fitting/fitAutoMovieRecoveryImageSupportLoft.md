# src/fitting/fitAutoMovieRecoveryImageSupportLoft.ts#fitAutoMovieRecoveryImageSupportLoft

## @evidence contracts/development/implementation.md#principled-implementation

Shared measured-row admission/interpolation and Householder spline fitting preserve the supplied pixel charts. Oriented upper/negative-lower support profiles define a finite half-plane intersection, whose actual directional supports and continuous engine boundary plan are checked separately from each profile's residual.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Recovery owns observation policy, compact inverse fitting and residual acceptance; generic engine owns support intersections, event incidence and new geometry/normals. The saved recipe excludes dense observations and source geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ellipse prior, fixed polygon correspondence, per-row saved contour, discarded view, inferred cap, original mesh/normal or camera estimate supplies the result. Exhausted residual/rank/event/geometry budgets refuse without changing thresholds.

## @evidence contracts/development/common.md#meaningful-documentation

States support rather than material correspondence, cubic candidate order, common-domain comparison, implied-hull checks, supplied cameras, partial unknown coverage and numerical rather than certified enclosure status.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N common rows, V views and K=spans+3, each candidate costs O(N K squared + N K V + N V cubed), plus the generic engine's bounded continuous planning/emission. maxViews/maxRows/maxSpans and event/cell/vertex budgets bound all retained populations before their owning allocations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One common chart and fixed-direction section query serve every candidate; one factorization serves all 2V fields. A reusable offset vector is overwritten before each synchronous query, which retains no offsets. Each returned section is copied once into call-local binary64 coordinate scratch for indexed projection scans; each view's exact opposite normals share that scan while both offset and implied-support residuals remain checked. A maximum residual can only grow, so one violating row rejects that candidate without scanning its remaining rows; acceptance still checks every row and view. Per-row Bernstein weights are shared, and accepted engine diagnostics retain no acquisition-time mesh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local observation, fit and temporary engine scratch expires synchronously; only compact coefficients, source identities and scalar diagnostics transfer. The coordinate buffer holds at most two scalars per plane pair, bounding every section query's possible output; the offset vector holds 2V scalars. Both are call-owned and reused without retaining rows or query output. Cancellation is checked between candidates and before transfer, with no file, worker or global cache acquired.
