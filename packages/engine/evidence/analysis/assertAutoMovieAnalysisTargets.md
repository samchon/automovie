# src/analysis/assertAutoMovieAnalysisTargets.ts#assertAutoMovieAnalysisTargets

## @evidence contracts/development/implementation.md#principled-implementation

One pass rejects a blank key or unit, a non-finite value, a comparison outside the two-member union and a repeated key, which are exactly the conditions under which `autoMovieAnalysisMetric` could not pick one comparable target for a metric.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Every analyzer calls this one guard from its request validator, so target rules are stated once; applicability to reported keys is left to `warnAutoMovieAnalysisTargetKeys` because it needs the metrics this check runs before.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It checks `comparison` at runtime although its type is a closed union because targets arrive from authored data, and no key, unit or analyzer is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why targets are refused early, the five refused faults, the first-in-list-order throw, and which function checks key applicability instead.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the T targets with a `Set` of seen keys, so duplicate detection is O(T) instead of a pairwise O(T²) scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each analyzer calls it once per study on that study's own targets; no verdict outlives the call to be shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The seen-key set grows to at most T entries and is released when the call returns or throws; nothing is retained.
