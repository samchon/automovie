# src/audio/measureAutoMovieDialogueLipSync.ts#measureAutoMovieDialogueLipSync

## @evidence contracts/development/common.md#meaningful-documentation

The comment states where the drawn mouths come from, which lines are measured, the window, both series and their sources, and the three unmeasured reasons with when each applies.

## @evidence contracts/development/implementation.md#principled-implementation

The mouth series is the `jawOpen` weight of the visemes the subject read on each drawn frame, the value it handed a VRM or imported figure, and the level series is the line's own frame RMS, so their lag is the lag between the drawn mouth and the sound (#4055). A figure moved only by the jaw follows the line's own loudness and has zero lag by construction, so it is not measured.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Render owns the route from drawn mouths to entries; the levels and the measurement are engine's, and the preset mapping is render's shared table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No line is special-cased and no series is recomputed from the track: a subject that drew the mouth late is measured late.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per measured line, O(F × A) for F window frames and A actors read on a frame, plus one pass over its samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each line is measured once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns plain records and holds nothing.
