# src/render/measureAutoMovieRenderFeeds.ts#measureAutoMovieRenderFeeds

## @evidence contracts/development/implementation.md#principled-implementation

Counts what `prepareAutoMovieSurfaceGraphics` builds: one render target per feed layer of every key, sized by `autoMovieSurfaceFeedWidth`, the rule render allocates by, at an RGBA8 colour texture plus a 32-bit depth word per pixel; and one scene pass per feed a frame can show, bounded by the largest key of each track because one key per track is in force at a time.

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

# src/render/measureAutoMovieRenderFeeds.ts#measureAutoMovieRenderFeeds.ITrack

## @evidence contracts/development/design.md#principled-representation

One track's mask owner, its target count, its bytes and its pass bound, in the units the inventory sums.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what the inventory writes as the track's rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps the owner id the mask uses, not a new identity.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it counts and its unit.

# src/render/measureAutoMovieRenderFeeds.ts#measureAutoMovieRenderFeeds.IResult

## @evidence contracts/development/design.md#principled-representation

The per-track rows and the three sums the inventory adds to its totals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the inventory reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sums are derived from the rows, not estimated separately.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it sums.