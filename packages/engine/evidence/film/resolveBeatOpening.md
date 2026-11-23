# src/film/resolveBeatOpening.ts#resolveBeatOpening

## @evidence contracts/development/implementation.md#principled-implementation

Samples at shot-local zero through the shared `resolveBeatSnapshot`, the same rules as the end state, so comparing an opening with the previous end compares two measurements of one kind; a performance that starts later is held at its clip's first frame because its clip-local time clamps to zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A named entry point that fixes the instant at zero, the mirror of `resolveBeatEnd`, so the sampling rules exist once and the two boundaries cannot disagree about how a state is read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no rule of its own and does not seed itself from a previous beat; the overlay of carried fields happens in `compileDefinedShot`, where the previous state is in hand.

## @evidence contracts/development/common.md#meaningful-documentation

States the instant, the shared shape and its resumable fields, what the continuity check compares it with, how `compileDefinedShot` overlays carried fields, and every throw.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Delegates the whole cost to `resolveBeatSnapshot`, which answers it; this wrapper passes a constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computes one shot's opening state per call and caches nothing; `validateFilmContinuity` resolves each beat's opening once and pairs it with the previous beat's end, and `compileDefinedShot` stores its own copy on the compiled result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing after returning; the opening states it hands back are owned as `resolveBeatSnapshot` describes.
