# src/analysis/autoMovieDaylightSettings.ts#autoMovieDaylightSettings

## @evidence contracts/development/implementation.md#principled-implementation

A fixed-order JSON projection of the study's declared fields, so equivalent declared studies give the same text for the run digest; shades and luminaires keep only their declared fields and list order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Extracted from the daylight study as the one place its settings text is written; target projection is the shared `autoMovieAnalysisSettingsTargets`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nested context, instant and workplane records are serialized as supplied, and the documentation says so instead of claiming a filtered identity.

## @evidence contracts/development/common.md#meaningful-documentation

States every serialized field, which records are projected and which pass through unfiltered, and the cost.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the serialized entries and text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per study, before the run is sealed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary projections are released on return; only the returned string survives.
