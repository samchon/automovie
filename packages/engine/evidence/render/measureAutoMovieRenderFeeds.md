# src/render/measureAutoMovieRenderFeeds.ts#measureAutoMovieRenderFeeds

## @evidence contracts/development/implementation.md#principled-implementation

Counts what `prepareAutoMovieSurfaceGraphics` builds: one render target per feed layer of every key, sized by `autoMovieSurfaceFeedWidth`, the rule render allocates by, at an RGBA8 colour texture plus a 32-bit depth word per pixel, and, for a directly rendered film, the response stage each feed draws through at its own raster (`measureAutoMovieFilmResponseTargets`) with its medium march target when the scene carries a medium; and one scene pass per feed a frame can show, bounded by the largest key of each track because one key per track is in force at a time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory owns totals and rows; this function owns only the feed layers' targets and passes, and the width rule is the one `autoMovieSurfaceFeedWidth` holds for render too.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every feed layer is counted whether or not its key is shown at frame 0, because every target is allocated for the whole shot; an unresolvable face throws instead of counting a zero-size target.

## @evidence contracts/development/common.md#meaningful-documentation

States the sizing rule, the bytes per pixel and their source, the pass bound, the refusal and the result's fields.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the tracks' keys and layers, `O(L)`, with node and model lookups through maps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per inventory over that subject's tracks; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh rows and retains nothing.
