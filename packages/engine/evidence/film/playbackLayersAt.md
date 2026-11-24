# src/film/playbackLayersAt.ts#playbackLayersAt

## @evidence contracts/development/implementation.md#principled-implementation

The live entry is `playbackEntryAt`'s and the sample `playbackSampleAt`'s, the pair `resolveFromTimeline` uses, so the layers sit on the same instant `playbackCursor` resolves. A cross dissolve is the linear mix of the two shots over the overlap; a fade is the dip to black an editor's fade between two shots makes, the outgoing shot alone fading out over the first half and the incoming alone fading up over the second, `IAutoMovieTransition`'s definition. `1 - alpha` and `alpha` sum to exactly 1 in binary64 for `alpha` in `[0, 1)`: below one half the rounding of `1 - alpha` is at most 2⁻⁵⁴ and the sum rounds back to 1, and from one half `1 - alpha` is exact by Sterbenz's lemma.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one owner of a transition's layer weights; the draw page, the viewer and the tests read them here, and `renderAutoMovieFilmFrame` turns them into a direct, fade or dissolve composite.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each kind has one formula for every entry; the fade's midpoint is the incoming layer at weight 0 by the formula, not a special case.

## @evidence contracts/development/common.md#meaningful-documentation

States the live entry's source, the layers outside a transition, both kinds' weights, the midpoint, the exact complementary sum, each layer's clock and the precondition.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log E) for E timeline entries, the binary search of `playbackEntryAt`; the rest is constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; a caller sweeping a whole film may hold the timeline and call it per frame, and the search is the only repeated work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the one or two returned layers.
