# src/film/playbackSampleAt.ts#playbackSampleAt

## @evidence contracts/development/implementation.md#principled-implementation

Shot-local time is the elapsed output time scaled by that entry's rate and added to its source offset, and the dissolve weight is the linear ramp of elapsed time over the transition duration, both affine in `seconds`; it relies on `sequenceTimeline` placing every entry and refusing a first-entry transition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one constructor behind the stateless `resolveFromTimeline` and the forward `playbackCursor`, which each carried a private copy, so random access and a sweep return identical samples for the same instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every entry and transition is sampled by the same two formulas; no shot or transition kind is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the live time formula, when a blend exists, the blend's time and weight, who chooses the live entry, why the previous entry exists, and the clock of each argument.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: two array reads and a few arithmetic operations per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure constructor of one sample that coordinates no work; locating the live entry, the costly part, is the caller's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned sample.
