# src/draw/placeAutoMovieDrawLayer.ts#placeAutoMovieDrawLayer

## @evidence contracts/development/common.md#meaningful-documentation

States which placement each case takes, which clock it reads, what a time before the in-point and before the shot's zero means, what a subject without `seekShot` gets, and the refusal of a tail without it.

## @evidence contracts/development/implementation.md#principled-implementation

At a second the layer's entry is live at, the entry `playbackEntryAt` resolves, the subject's `seek` places exactly that entry; elsewhere `playbackEntryTime`'s affine entry clock gives the shot-local time, which before the in-point runs into the shot's handle as an editor's handle frames supply a cut's first exposure, and the engine's clip samplers hold their first state before the shot's zero. A subject without `seekShot` can reach the entry only through `seek`, so a sample before the in-point takes the entry's state at the in-point, the nearest state of that entry, and a cut's first frame keeps no trace of the previous shot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one of three placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Without `seekShot` a sample before the in-point is held at the in-point by `seek`, the entry's own first state, never placed on the previous shot by the film second; a tail past the entry's start that only `seekShot` can place is refused by name.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(log E) entry search for E entries and one placement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is one placement of a distinct second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the subject owns what its placement holds.
