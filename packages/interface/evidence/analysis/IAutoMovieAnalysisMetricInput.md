# src/analysis/IAutoMovieAnalysisMetricInput.ts#IAutoMovieAnalysisMetricInput.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Build one metric, resolving whatever target the production declared for it. Member documentation states the supplied records, units and absence meanings used by autoMovieAnalysisMetric.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record permits value/gap combinations that TypeScript cannot relate; autoMovieAnalysisMetric enforces that relation. targets and the warning sink remain the caller's records.

## @evidence contracts/development/design.md#principled-representation

key and unit identify one metric; value is finite or null, gap explains null, and status distinguishes unsupported from not-run. autoMovieAnalysisMetric rejects inconsistent value/gap pairs and compares unit strings exactly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieAnalysisMetricInput.IProps, used by autoMovieAnalysisMetric. Its key, unit, value, targets, warnings, gap, status members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
