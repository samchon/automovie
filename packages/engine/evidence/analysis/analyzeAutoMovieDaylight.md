# src/analysis/analyzeAutoMovieDaylight.ts#analyzeAutoMovieDaylight

## @evidence contracts/development/implementation.md#principled-implementation

Sums beam, isotropic-sky and point-luminaire illuminance at each cell centre, with occlusion by the analytic half-space slab test and the sky term estimated over a deterministic cosine-weighted Hammersley hemisphere whose cosine weighting cancels Lambert's cosine, so the visible fraction times DHI is the sky illuminance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns sampling, metrics and sealing, with a private helper for the beam component, the luminaire component from `autoMovieArtificialIlluminance`, the sky term from `autoMovieSkyIlluminance`, which the illuminance meter shares, and the settings text from `autoMovieDaylightSettings`; request checking and frame resolution live in `resolveAutoMovieDaylightRequest`, and directions, occlusion, metric building and sealing are shared analysis helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unimplemented sky returns an `unsupported` run and ground reflection is an `unsupported` metric; the luminaire helper's 1e-12 epsilon guards only a fitting coincident with a sample point, and no study or fixture is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the three illuminance laws, the excluded ground reflection, the unsupported, not-run and gap cases, the settings digest, and where the sky estimate is exact.

## @evidence contracts/development/implementation.md#efficient-algorithms

After request validation and direction/settings construction, C cells cost O(C*(D+L+1)*(1+sum(P))) in the unobstructed worst case, plus fixed metric-to-target scans and encoded-text hashing. C is at most 4096; sky count D and luminaire/solid populations are unbounded. Skyward filtering is shared per study and each solid scan stops at the first blocker without a spatial index.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One unit normal, one sky-direction set and its skyward subset, one solid list and one coincident-luminaire set are shared across every cell, valid because each depends only on the plane, the ground, the context and the shades fixed for the study; the sky set is not built for an artificial-light study that never reads it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local storage includes O(C) light/sample arrays, O(D) directions, a combined solid list and coincidence/warning populations growing with luminaires and targets. Only C has the sample cap; the caller owns returned samples/warnings and no study cache persists.
