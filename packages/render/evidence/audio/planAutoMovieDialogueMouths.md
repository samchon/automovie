# src/audio/planAutoMovieDialogueMouths.ts#planAutoMovieDialogueMouths

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which lines enter, what each carries, which engine functions give the jaw and the viseme ranges, and that the same lines and clock give the same track for a capture and a delivery.

## @evidence contracts/development/implementation.md#principled-implementation

The jaw is #4054's envelope: each frame's RMS of the line's own samples on the clock the mix places it with, mapped by the envelope jaw's floor and full levels. The ranges are each phoneme's equal share of its chunk placed on the emission clock from the line's start frame, the timing the coarticulation sampler reads. A line enters only when its speaker binds to one actor, the binding the viseme join requires.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Render owns the plan because it feeds the draw page; timing, levels and the jaw law are engine's, and sampling the track at a second is engine's `sampleAutoMovieDialogueMouth`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No line, speaker or actor is special-cased; a bound line that fails to join is an error, never dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the lines' samples for the levels, plus the phonemes of each chunk and the bindings per line.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One plan per render or capture; the host hands it to the page once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a plain JSON track and holds nothing.
