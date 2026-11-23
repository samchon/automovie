# src/audio/measureAutoMovieDialogueLipSync.ts#measureAutoMovieDialogueLipSync

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which lines are measured, the window, both series and their sources, why the jawOpen series is the one phoneme timing drives today, and the two unmeasured reasons.

## @evidence contracts/development/implementation.md#principled-implementation

The mouth series is the `jawOpen` weight the coarticulated visemes give a VRM or imported model, the value the render would draw, and the level series is the line's own frame RMS, so their lag is the lag between the mouth handed to the drawing and the sound. A line without chunks follows its own envelope and has zero lag by construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Render owns the route; timing, blending, levels and the measurement are engine's, and the preset mapping is render's shared table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No line is special-cased; the Human and polygon man are not measured separately because they receive only the envelope jaw until #3185.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per measured line, O(F × R) for F window frames and R ranges, plus one pass over its samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each line is measured once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns plain records and holds no resource.
