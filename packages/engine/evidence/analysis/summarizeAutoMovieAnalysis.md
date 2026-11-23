# src/analysis/summarizeAutoMovieAnalysis.ts#summarizeAutoMovieAnalysis

## @evidence contracts/development/implementation.md#principled-implementation

Validates each run, folds counters by the fixed domain table, adds missing required domains and applies misses-before-incomplete-before-meets precedence. Untargeted measured metrics and warnings do not create a gap. JSON-array lines delimit covered fields, but omitted gap contents, signed-zero distinctions and SHA-256 collisions prevent treating equal digests as proof of identical source reports.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the rollup, the bound and the digest because each depends on the same fold; run validation is delegated to `validateAutoMovieAnalysisRun` so a report accepts exactly the runs a reader would.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No domain, run id or status is special-cased; the default bound is the exported `AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS`, and a non-required domain's gaps still count toward `incomplete` because every submitted metric must produce a value.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why silence cannot clear the report, the mandatory required domain, where gaps come from and their order, the status precedence, the bound, what the digest covers and its line form, and every throwing input; each property states its role and default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in runs plus their metrics and samples, dominated by the validator rehashing every run, which is required because a deserialized run must be re-proven unedited; run-id uniqueness and required-domain membership are hashed lookups.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call folds the runs it is handed into one report; no validation verdict or digest is kept across calls because the runs may have been edited since.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Listed gaps are retained only up to the bound and later ones are counted, so gap memory is O(maxGaps) rather than O(total gaps); the id set grows with run count and the rollup map is fixed at six rows, all call-local except the returned report, which keeps the rows and the listed slice.
