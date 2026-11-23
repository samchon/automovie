# src/animals/AutoMovieArchetypeEquineSpanishWalk.ts#AutoMovieArchetypeEquineSpanishWalk.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the input and output.

## @evidence contracts/development/implementation.md#principled-implementation

Per sample, each swinging fore limb's progress is its endpoint's world forward travel between the footprints sampled at its neighbouring landings; its bars turn rigidly about the shoulder by a half-sine of that progress.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Base sample, swing detection, rigid turn, repose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Stance limbs and every other part keep the walk's frames exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

A sample reads the base once and, for a swinging fore limb, the base at its two neighbouring landings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the walk's own landings and footprints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the base ride and its landing lists.
