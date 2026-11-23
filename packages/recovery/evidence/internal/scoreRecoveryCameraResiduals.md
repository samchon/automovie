# src/internal/scoreRecoveryCameraResiduals.ts#scoreRecoveryCameraResiduals

## @evidence contracts/development/implementation.md#principled-implementation

Each finite residual is an observation of the supplied error definition; its magnitude is compared inclusively with the declared threshold. Ordered support and linear-interpolated median/p90 report only the retained finite population.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scoring convention serves calibrated Sampson consensus and planar transfer competition without conflating their distinct pixel metrics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Null and nonfinite observations are never inliers, empty populations are not perfect fits, and no sorted prefix or fixture-specific cutoff discards an admitted residual.

## @evidence contracts/development/common.md#meaningful-documentation

States inclusive threshold, absolute units, observation-order indices, quantile interpolation and empty-support meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

N observations need O(N) scanning and O(M log M) sorting of M retained magnitudes with O(M) scratch; the small admitted correspondence population bounds this repeated proposal statistic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One retained/sorted population supplies both median and p90; input order is preserved separately for later fitting subsets.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only owned indices and nullable scalars escape; sorted temporary errors expire and no observation array, image, cache or external handle is retained.
