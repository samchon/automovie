# src/film/playbackCursor.ts#playbackCursor

## @evidence contracts/development/implementation.md#principled-implementation

A monotone two-pointer sweep: the query clock and entry starts are non-decreasing, so the live index only advances; start <= seconds selects the last containing entry and highest equal start, matching the stateless binary search. A non-decreasing query clock is the stated premise met by playbackFrameSamples and render/caption planners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sweep owns only the live-entry search; the sample itself comes from the shared `playbackSampleAt`, so the cursor and the random-access resolver cannot drift.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No entry or transition is special-cased; a backward query is a documented misuse rather than something the cursor silently repairs.

## @evidence contracts/development/common.md#meaningful-documentation

States the ordering premises, the tie rule and why it matches random access, the retained state, the effect of a backward query and the alternative, and who drives it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Amortized constant time per query: the index advances at most once per entry, so n frames over m entries cost O(n+m), while repeated stateless binary searches cost O(n log m). Both share constant-sized sample construction, and no unmeasured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the live index found by the previous query as the start of the next search, which is valid because the query clock never decreases; the timeline itself is built once by the caller and shared by every query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the sequence, the entry list and one index for as long as the caller holds the resolver, a constant bound beyond the caller's own timeline, and releases them when the resolver is dropped.
