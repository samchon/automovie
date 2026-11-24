# src/analysis/autoMovieArtificialIlluminance.ts#autoMovieArtificialIlluminance

## @evidence contracts/development/implementation.md#principled-implementation

Each point luminaire contributes `I * cos / r^2` by the inverse-square cosine law, zero behind the plane or when the analytic solid-union ray test finds a blocker within the fitting's distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Extracted from the daylight study as its luminaire component, so the study reads as its beam, sky and luminaire terms; the coincident-fitting set is the caller's, because the warning is about the study's fitting, not one point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-12 m epsilon guards only a fitting coincident with the point, where the inverse-square law has no value, and is reported as a warning rather than hidden; no luminaire or study is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the law, the coincident-fitting case and its once-per-fitting warning, the overflow limit, the cost and what survives the call.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L * (1 + sum(P))) for L luminaires and P planes per solid, each ray test stopping at its first blocker.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Measures one point per call; the study shares its solid list and coincidence set across points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing itself; it appends at most one warning and one id per fitting to the caller's list and set.
