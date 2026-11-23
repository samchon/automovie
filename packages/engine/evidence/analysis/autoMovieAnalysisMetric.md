# src/analysis/autoMovieAnalysisMetric.ts#autoMovieAnalysisMetric

## @evidence contracts/development/implementation.md#principled-implementation

Encodes the metric shape rules directly: a null value requires a gap and defaults to `not-run`, a value must be finite and gap-free, and a same-key target in the same unit decides `meets` or `misses` through `autoMovieAnalysisTargetMet`, the predicate the run validator re-derives verdicts with.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One builder shared by every analyzer owns target resolution, so each solver states only key, unit, value and gap; the verdict expression lives in `autoMovieAnalysisTargetMet` because the validator needs the same rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A unit-mismatched target is dropped with a `target-unit-mismatch` warning instead of being compared or converted, and no metric key, unit or analyzer is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the unit-mismatch outcome and why, the three throwing shapes, that a valueless metric carries no target, exact-string unit comparison, and which target decides; each property states its role, the `not-run` default and when a gap is required.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear `find` over the T declared targets per metric, so resolving a run of M metrics costs O(M·T); a key index would cost a map per study for runs that resolve at most eleven metrics (the daylight run) against a handful of targets.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call resolves one metric of one run against that study's own targets; there is no completed or in-flight result another call could reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new metric record and appends at most one warning to the caller-owned array, retaining nothing itself.
