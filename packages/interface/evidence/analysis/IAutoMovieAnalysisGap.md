# src/analysis/IAutoMovieAnalysisGap.ts#IAutoMovieAnalysisGap

## @evidence contracts/development/design.md#principled-representation

One row shape distinguishes the run, metric and domain granularities through nullable `run` and `metric`; `summarizeAutoMovieAnalysis` emits run-level rows with `metric: null` and unanswered-domain rows with both null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single list instead of separate unsupported-run, missing-metric and missing-domain lists, so the report bounds and digests one sequence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Staleness has no status of its own and is reported as `not-run` with a re-run remedy, a stated mapping rather than a hidden one; reasons and remedies are copied from validated runs or written by the summarizer, never left blank.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the three granularities, what null `run` and `metric` mean, which situations map to each status, and that reason and remedy are non-blank.
