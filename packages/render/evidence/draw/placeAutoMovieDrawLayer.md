# src/draw/placeAutoMovieDrawLayer.ts#placeAutoMovieDrawLayer

## @evidence contracts/development/common.md#meaningful-documentation

States which placement each case takes, which clock it reads, what a time outside the trimmed span and beyond the shot's own ends means, what a subject without `seekShot` gets, and the error for an entry the cut lacks.

## @evidence contracts/development/implementation.md#principled-implementation

Inside the layer's live span, from its start to the next entry's, where `playbackEntryAt` resolves it, the subject's `seek` places exactly that entry; elsewhere, the film's first frame included, `playbackEntryTime`'s affine entry clock gives the shot-local time, which outside the trim runs into the shot's head or tail handle as an editor's handles supply a shot's edges, and the engine's clip samplers hold their end states beyond the shot's own ends. A subject without `seekShot` can reach the entry only through `seek`, so a second outside its live span takes the nearest second it is live at, its in-point or the last representable second before the next entry's start, the nearest state of that entry, and a cut's first frame or trail keeps no trace of another shot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one of three placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second is placed on another entry's shot through the film clock; an entry the cut lacks is refused by name. A transition without `seekShot` is refused earlier, by the layer plan.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(log E) entry search for E entries and one placement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is one placement of a distinct second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the subject owns what its placement holds.