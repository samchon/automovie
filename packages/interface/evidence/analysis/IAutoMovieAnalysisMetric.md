# src/analysis/IAutoMovieAnalysisMetric.ts#IAutoMovieAnalysisMetric

## @evidence contracts/development/design.md#principled-representation

Value, target, comparison, status and gap are partners that `validateAutoMovieAnalysisRun` cross-checks: a null value requires a gap and forbids target and comparison, and `meets` or `misses` must equal the recomputed inclusive comparison.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A flat record with nullable members rather than a union of measured and missing arms, because `autoMovieAnalysisRunDigest` serializes every member, gap text included, as one fixed-order JSON tuple per metric.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `autoMovieAnalysisMetric` throws on a value with a gap, on neither, and on a non-finite value. Key/unit/gap text, target validity and status membership rely on upstream admission and run sealing; an invented finite value cannot be identified as unmeasured from this record alone.

## @evidence contracts/development/common.md#meaningful-documentation

States the value-gap invariant, the unit every number is in, when target and comparison are null, the uniqueness of the key, and the status agreement rule.
