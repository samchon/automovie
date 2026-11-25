# src/scene/inspection/sameAutoMovieInspectionShotClock.ts#sameAutoMovieInspectionShotClock

## @evidence contracts/development/common.md#meaningful-documentation

States which shot clocks match, the unaddressed case and the rounding allowance.

## @evidence contracts/development/implementation.md#principled-implementation

Each addressed sample identifies its source shot and the film second of shot-local zero. Both identify the same clock when the path agrees and subtraction yields the same origin within floating-point rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve absent clocks and path identity before comparing origin seconds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A different path, nonfinite origin or one missing shot address cannot match a recorded shot clock.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses constant time and memory for two samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure arithmetic on the supplied clocks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean and keeps nothing.
