# src/draw/placeAutoMovieDrawLayer.ts#placeAutoMovieDrawLayer

## @evidence contracts/development/common.md#meaningful-documentation

States which placement each case takes, which clock it reads, what a time before the in-point and before the shot's zero means, and the refusal without `seekShot`.

## @evidence contracts/development/implementation.md#principled-implementation

At a second the layer's entry is live at, the entry `playbackEntryAt` resolves, the subject's `seek` places exactly that entry; elsewhere `playbackEntryTime`'s affine entry clock gives the shot-local time, which before the in-point runs into the shot's handle as an editor's handle frames supply a cut's first exposure, and the engine's clip samplers hold their first state before the shot's zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one of two placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A placement that needs `seekShot` without it is refused by name, never placed by the film second or clamped to the entry's start.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(log E) entry search for E entries and one placement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is one placement of a distinct second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the subject owns what its placement holds.
