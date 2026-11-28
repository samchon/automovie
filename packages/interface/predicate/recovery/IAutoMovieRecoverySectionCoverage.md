# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage

## @evidence contracts/development/common.md#meaningful-documentation

A prefix checkpoint distinguishes its retained station range, missing planned stations and missing physical source extent.

## @evidence contracts/development/design.md#principled-representation

Planned coordinate coverage and source extent are separate intervals because the final station and the source endpoint can differ.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extraction measures the checkpoint and its remaining source. A downstream realization cannot infer terminal closure from the absence of later stations.

# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage.complete

## @evidence contracts/development/common.md#meaningful-documentation

Only the bounded station-prefix path publishes this coverage record and marks it incomplete.

# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage.plannedSections

## @evidence contracts/development/common.md#meaningful-documentation

The producer reads the count before applying the station prefix limit.

# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage.retainedSections

## @evidence contracts/development/common.md#meaningful-documentation

The producer counts the selected initial coordinates after applying the configured station limit.

# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage.sourceRangeMm

## @evidence contracts/development/common.md#meaningful-documentation

The extractor computes it from the registered source's axis heights rather than from the retained station list.

# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage.observedStationRangeMm

## @evidence contracts/development/common.md#meaningful-documentation

Both endpoints come from the retained planned prefix.

# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage.unobservedStationRangeMm

## @evidence contracts/development/common.md#meaningful-documentation

This optional range starts at the first planned coordinate after the retained prefix, independent of the source surface extent.

# src/recovery/IAutoMovieRecoverySectionCoverage.ts#IAutoMovieRecoverySectionCoverage.missingSourceRangeMm

## @evidence contracts/development/common.md#meaningful-documentation

When the final retained station lies below the maximum source height, the extractor reports the physical tail to that source height.
