# src/drawing/autoMovieOpeningOutlinePoints.ts#autoMovieOpeningOutlinePoints

## @evidence contracts/development/implementation.md#principled-implementation

Uniform angular subdivision of each arc from `autoMovieOpeningArc`, which places every chord point exactly on the circle; the stated limitation is that the chords cut inside the arc by at most `r (1 - cos(step / 2))`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the drafted ring of a profile and delegates the circle to the shared arc conversion, keeping measurement out of drafting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No opening is special-cased; the step is a named contract constant chosen for determinism rather than tuned per arc.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states what each edge contributes, the closing convention, the frame, why the density is fixed, and which consumers measure instead of reading the chords.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the edge count plus the emitted chord points, at most sixteen per half-turn arc, so output size bounds the work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per drawn opening per derivation; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The drafted ring is handed to the caller, which projects and rounds it at once; the arc records made per edge die with the loop iteration.
