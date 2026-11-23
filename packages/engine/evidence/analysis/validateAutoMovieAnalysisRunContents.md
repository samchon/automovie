# src/analysis/validateAutoMovieAnalysisRunContents.ts#validateAutoMovieAnalysisRunContents

## @evidence contracts/development/implementation.md#principled-implementation

Indexed walks refuse missing metric/sample/warning records, then a `ViolationCollector` accumulates semantic faults, `Set`s check metric-key/sample-id uniqueness, and samples require a measured key; judged metrics require one of the two comparison directions before their verdict is re-derived. Other nested shapes remain a typed-input premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The contents rules live once here because two owners need them without the seal: the public validator adds the digest check, and the seal checks before hashing; per-metric rules sit in one private helper because they branch on the value's presence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fixed values are contract constants (version 1, the `automovie.analysis-run.v1` protocol, the `sha256:` pattern, `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`); an unknown outcome status is reported rather than skipped, and the cast in that branch only reads a status the union says cannot occur.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the absent-measurement rules, the violation order and root, which caller checks the excluded seal and why, and the shape premise with its `TypeError` consequence.

## @evidence contracts/development/implementation.md#efficient-algorithms

One indexed pass visits M metric, S sample and W warning slots, even when missing; hashed uniqueness and measured-key lookups avoid pairwise scans. The sample bound raises a violation without truncating the walk. String trimming, hashing and diagnostic construction additionally depend on authored text lengths; three call-local key sets hold at most M+S ids/keys.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call checks the one run it is handed; the seal and the public validator call it on different occasions, and no verdict is cached because a deserialized run must be re-proven.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The key sets are call-local and released on return; violations appended to the caller's collector may reference fragments of the run, and the caller owns the collector.
