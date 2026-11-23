# src/composition/resolveAutoMovieSchedule.ts#resolveAutoMovieSchedule

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Place a composition on the film clock with the production's pure laws) and documents parameters `composition`, `laws`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

A single depth-first walk of the composition tree in declaration order, the interval-placement scheme of a timeline composer: a sequence chains ends to starts, a parallel group takes the latest end, an `at` takes an anchor's instant plus an offset. The premises are seconds on the film clock, the laws being pure (the same inputs give the same schedule, and an aligned part is timed again at the start `laws.align` returns), and every reference resolving to a placed anchor, a cue track or an event, which the walk checks and refuses with an `AutoMovieScheduleError` naming the code, the subject and capability, the value and the alternatives (anchor, event, index, duplicate, share, timing and law). A cut is a share in [0, 1] of the duration, found from a share, an own event, another anchor's or a cue track's event, or the `until` law's proximity share; a proximity never met cuts nothing. A start-aligned part places once, an aligned one asks `laws.align` first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One recursive `place` over the four node kinds: the sequence and the group are its own joints, an intent and an `at` are placed by `AutoMovieSchedulePlace`, the cut by `AutoMovieScheduleCut`, and the instant lookups and the walk's state are `AutoMovieScheduleWalk`'s; the error shapes sit in `AutoMovieScheduleError`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; two non-null assertions (`entries[first]!`, `interrupted.get(e.index)!`) follow a length or `has` check. The only numeric literals are the structural 0 and 1 of the [0, 1] share range and indices; every value comes from the composition or the laws.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the n nodes of the composition; each anchor lookup is a map read, and each event lookup builds the anchor's instants and filters them, O(e) in that anchor's events. The result is one sort of the m entries, O(m log m), and one loop over their ends for the duration. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 17 allocation sites become the returned value or die with the call, so nothing grows.
