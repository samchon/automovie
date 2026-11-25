# src/geometry/construction/AutoMovieLoftFrameSource.ts#AutoMovieLoftFrameSource.retain

## @evidence contracts/development/implementation.md#principled-implementation

Each layer receives its actual source frame and analytic derivatives, so unchanged source intervals evaluate the original axis; a numerical value-only axis retains the existing layer interpolation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One post-solve conversion keeps coefficient interpolation independent of actual frame ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular station jet remains null with its finite frame value; only nonfinite source values or falsely finite jet records fail retention.

## @evidence contracts/development/common.md#meaningful-documentation

Returns the input for a value-only axis, a new immutable layer table on success, or the failed station premise; source and layer snapshots must remain unchanged thereafter.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L) source queries and fixed numeric copies prepare L layers, plus each axis query's documented cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All records retain the one prepared axis and each query supplies value and derivatives together.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Success owns a new layer list, fixed snapshots and axis references; failure retains no partial output and no external resource.

# src/geometry/construction/AutoMovieLoftFrameSource.ts#AutoMovieLoftFrameSource.validate

## @evidence contracts/development/implementation.md#principled-implementation

Checks callable ownership and exact station/value/derivative equality against independent source snapshots; value copies of the same data remain equivalent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validator is shared by interval reads and operations preserving a layer's source.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Throws on a present stripped/stale source; does not clear it or quietly choose another frame geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Absence is allowed; transformed producers must explicitly remove or re-express source ownership, and in-place mutation remains unsupported by chain caches.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 27 exact component comparisons and one callback-presence check take constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure validation creates no reusable preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no layer, source or output after returning or throwing.

# src/geometry/construction/AutoMovieLoftFrameSource.ts#AutoMovieLoftFrameSource.actual

## @evidence contracts/development/implementation.md#principled-implementation

Both endpoints must retain the same valid analytic axis; the interval then reads that very source at the requested station.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Null identifies absent/different-source boundary interpolation; unavailable returned axis2 is an explicit admission error, while stale ownership and callback exceptions propagate unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No owner is inferred from matching sampled values, and an unavailable interior source jet does not trigger a fitted fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Callers use the ordinary Hermite rule only for null, preserving mixed-source continuation boundary jets.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed endpoint validation plus one actual source query; no layer scan or dense resampling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the prepared axis shared by both endpoint records.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh source jet or null and owns no cache or retained endpoint references.

# src/geometry/construction/AutoMovieLoftFrameSource.ts#AutoMovieLoftFrameSource.frame

## @evidence contracts/development/implementation.md#principled-implementation

Reads actual unchanged-source frames first, then preserves the existing framed Hermite, horizontal or Catmull-Rom/rotation interpolation rule for layer-defined intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner keeps source selection and every frame fallback together; the chain supplies its already found bracket.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not normalize interpolated axes or change the old fallback arithmetic, bounds or neighbour selection.

## @evidence contracts/development/common.md#meaningful-documentation

lo/hi are the admitted chain bracket; explicit source validation distinguishes missing support from corrupted retained data.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant neighbour and nine-component work follows bracket lookup, plus actual source-query cost when used.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the caller's bracket and prepared source; fallback endpoint weights are computed once per reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every returned frame owns local vectors; no chain or interpolation result is retained globally.
