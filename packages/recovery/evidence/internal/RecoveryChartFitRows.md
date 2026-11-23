# src/internal/RecoveryChartFitRows.ts#RecoveryChartFitRows

## @evidence contracts/development/implementation.md#principled-implementation

Tensor cubic Bernstein values and analytic first derivatives define linear position and physical directional-derivative observations of one coefficient field.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy row owner serves sparse assembly, independent data rank and final objective evaluation with identical signed weights and targets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Derivative targets remain explicitly distinct from points. No source normal field, clipping, regularizer or candidate-surface sample supplies observations.

## @evidence contracts/development/common.md#meaningful-documentation

States signed row weights, local parameter scales, millimetre target units, translation mass and private observation lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each input sample yields at most three fixed sixteen-term rows in O(1) arithmetic; no observation-count-sized derivative array is materialized.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both axis basis values and derivatives are computed once and reused by all rows of the sample. Callers reuse their existing immutable quadrature observations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The generator retains one sample and one fixed-size row until advancement or closure. Callers consume transient rows without retaining an expanded observation table.
