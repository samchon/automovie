# src/analysis/IAutoMovieAnalysisDomainRollup.ts#IAutoMovieAnalysisDomainRollup

## @evidence contracts/development/design.md#principled-representation

Counters filled in one pass by `summarizeAutoMovieAnalysis`: each run increments `runs` and then exactly one outcome counter, and only current solved runs add to the metric counters, which keeps the `runs` sum identity exact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Plain counts per domain with no embedded run list, so a report stays one fixed-size row per domain however many runs were submitted; run-level detail lives in the report's gap list.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A stale run's outcome is never counted as solved or its metrics as measured, and a required domain with zero runs keeps `runs: 0` beside `required: true` instead of being omitted.

## @evidence contracts/development/common.md#meaningful-documentation

States the counting identity, which runs feed the metric counters, why untargeted metrics have no field, and what each counter includes.
